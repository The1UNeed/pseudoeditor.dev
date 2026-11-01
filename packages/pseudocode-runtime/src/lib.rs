use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value as JsonValue};
use std::collections::HashMap;
use std::rc::Rc;

mod prepared;
#[cfg(test)]
mod reference;
use prepared::{Expression, Location, Statement, Symbol};
use wasm_bindgen::prelude::*;

const DEFAULT_INSTRUCTION_BUDGET: usize = 1_000_000;
// Enough steps to follow a program through a flowchart; longer runs keep the first steps.
const MAX_TRACE_STEPS: usize = 5_000;

#[derive(Debug, Clone, PartialEq)]
enum Value {
    Integer(i64),
    Real(f64),
    String(String),
    Boolean(bool),
    Array(Box<PseudoArray>),
    Null,
}

#[derive(Debug, Clone, PartialEq)]
struct PseudoArray {
    bounds: Vec<(i64, i64)>,
    default: Box<Value>,
    store: HashMap<Vec<i64>, Value>,
}

#[derive(Debug, Clone, Deserialize)]
struct RunInput {
    ast_json: String,
    stdin_lines: Vec<String>,
    virtual_files: HashMap<String, Vec<String>>,
    instruction_budget: Option<usize>,
    #[serde(default)]
    trace: bool,
}

/// One step of a traced run: a statement starting, or a condition being tested.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct TraceStep {
    line: usize,
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    test: bool,
    /// Lines of output written before this step, as stdout splits into lines.
    output: usize,
    /// For an IF or a CASE option: whether its condition held.
    #[serde(skip_serializing_if = "Option::is_none")]
    taken: Option<bool>,
}

#[derive(Debug, Clone, Serialize)]
struct Diagnostic {
    code: String,
    message: String,
    severity: String,
    line: usize,
    column: usize,
    #[serde(rename = "endLine")]
    end_line: usize,
    #[serde(rename = "endColumn")]
    end_column: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    hint: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct RunResult {
    success: bool,
    stdout: String,
    stderr: String,
    diagnostics: Vec<Diagnostic>,
    #[serde(rename = "virtualFiles")]
    virtual_files: HashMap<String, Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    trace: Option<Vec<TraceStep>>,
    #[serde(rename = "traceTruncated", skip_serializing_if = "std::ops::Not::not")]
    trace_truncated: bool,
}

#[derive(Debug, Clone)]
struct RuntimeError {
    message: String,
    line: usize,
    column: usize,
}

type RuntimeResult<T> = Result<T, RuntimeError>;

#[derive(Debug, Clone)]
struct FileHandle {
    mode: String,
    pointer: usize,
}

#[derive(Debug, Clone)]
enum Flow {
    Continue,
    Return(Value),
}

struct Runtime {
    ast: JsonValue,
    globals: Vec<Option<Value>>,
    global_types: Vec<Option<Rc<str>>>,
    scopes: Vec<HashMap<Symbol, Value>>,
    type_scopes: Vec<HashMap<Symbol, Rc<str>>>,
    symbols: HashMap<String, Symbol>,
    #[cfg(test)]
    use_prepared: bool,
    // Source ASTs remain alive for the run. Cache keys identify their stable nodes;
    // the prepared values own their decoded data and never dereference these addresses.
    prepared_statements: HashMap<usize, Rc<Statement>>,
    prepared_expressions: HashMap<usize, Rc<Expression>>,
    stdout: Vec<String>,
    stdin_lines: Vec<String>,
    stdin_cursor: usize,
    virtual_files: HashMap<String, Vec<String>>,
    open_files: HashMap<String, FileHandle>,
    functions: HashMap<String, Rc<JsonValue>>,
    procedures: HashMap<String, Rc<JsonValue>>,
    remaining_steps: usize,
    rng_state: u64,
    trace: Option<Vec<TraceStep>>,
    trace_truncated: bool,
    /// Lines written so far, counting the line breaks inside each OUTPUT, as the joined stdout has them.
    output_lines: usize,
}

impl Runtime {
    fn new(input: RunInput) -> RuntimeResult<Self> {
        let ast: JsonValue = serde_json::from_str(&input.ast_json)
            .map_err(|error| RuntimeError::new(format!("Invalid AST JSON: {error}"), 1, 1))?;

        let mut runtime = Self {
            ast,
            globals: Vec::new(),
            global_types: Vec::new(),
            scopes: Vec::new(),
            type_scopes: Vec::new(),
            symbols: HashMap::new(),
            #[cfg(test)]
            use_prepared: true,
            prepared_statements: HashMap::new(),
            prepared_expressions: HashMap::new(),
            stdout: Vec::new(),
            stdin_lines: input.stdin_lines,
            stdin_cursor: 0,
            virtual_files: input.virtual_files,
            open_files: HashMap::new(),
            functions: HashMap::new(),
            procedures: HashMap::new(),
            remaining_steps: input
                .instruction_budget
                .unwrap_or(DEFAULT_INSTRUCTION_BUDGET),
            rng_state: 0x9e37_79b9_7f4a_7c15,
            trace: input.trace.then(Vec::new),
            trace_truncated: false,
            output_lines: 0,
        };
        runtime.collect_routines();
        Ok(runtime)
    }

    fn run(mut self) -> RunResult {
        let outcome = self.execute_main();
        match outcome {
            Ok(_) => RunResult {
                success: true,
                stdout: self.stdout.join("\n"),
                stderr: String::new(),
                diagnostics: Vec::new(),
                virtual_files: self.virtual_files,
                trace: self.trace,
                trace_truncated: self.trace_truncated,
            },
            Err(error) => {
                let diagnostic = Diagnostic {
                    code: if error.message.contains("Instruction budget") {
                        "RUN408".to_string()
                    } else {
                        "RUN001".to_string()
                    },
                    message: error.message.clone(),
                    severity: "error".to_string(),
                    line: error.line,
                    column: error.column,
                    end_line: error.line,
                    end_column: error.column,
                    hint: Some("Check pseudocode runtime state and input values.".to_string()),
                };
                RunResult {
                    success: false,
                    stdout: self.stdout.join("\n"),
                    stderr: error.message,
                    diagnostics: vec![diagnostic],
                    virtual_files: self.virtual_files,
                    trace: self.trace,
                    trace_truncated: self.trace_truncated,
                }
            }
        }
    }

    fn execute_main(&mut self) -> RuntimeResult<()> {
        let body = self
            .ast
            .get("body")
            .and_then(JsonValue::as_array)
            .cloned()
            .unwrap_or_default();

        for statement in &body {
            let kind = str_field(statement, "kind");
            if kind == "procedureDefinition" || kind == "functionDefinition" {
                continue;
            }
            if let Flow::Return(_) = self.exec_statement(statement)? {
                break;
            }
        }
        Ok(())
    }

    fn collect_routines(&mut self) {
        let body = self
            .ast
            .get("body")
            .and_then(JsonValue::as_array)
            .cloned()
            .unwrap_or_default();
        for statement in body {
            match str_field(&statement, "kind") {
                "procedureDefinition" => {
                    self.procedures.insert(
                        str_field(&statement, "name").to_lowercase(),
                        Rc::new(statement),
                    );
                }
                "functionDefinition" => {
                    self.functions.insert(
                        str_field(&statement, "name").to_lowercase(),
                        Rc::new(statement),
                    );
                }
                _ => {}
            }
        }
    }

    fn exec_block(&mut self, statements: &[JsonValue]) -> RuntimeResult<Flow> {
        for statement in statements {
            match self.exec_statement(statement)? {
                Flow::Continue => {}
                flow @ Flow::Return(_) => return Ok(flow),
            }
        }
        Ok(Flow::Continue)
    }

    fn exec_statement(&mut self, statement: &JsonValue) -> RuntimeResult<Flow> {
        #[cfg(test)]
        if !self.use_prepared {
            return self.exec_statement_generic(statement);
        }
        let key = statement as *const JsonValue as usize;
        let prepared = match self.prepared_statements.get(&key) {
            Some(prepared) => prepared.clone(),
            None => {
                let prepared = Rc::new(Statement::new(statement, &mut self.symbols));
                self.prepared_statements.insert(key, prepared.clone());
                prepared
            }
        };
        self.exec_prepared(&prepared)
    }

    fn exec_statement_generic(&mut self, statement: &JsonValue) -> RuntimeResult<Flow> {
        self.step(statement)?;
        let kind = str_field(statement, "kind");
        // Blocks trace each test of their condition instead of their start.
        let if_test = match kind {
            "if" => self.record(span_line(statement, "startLine"), true),
            "while" | "for" | "repeat" | "case" => None,
            _ => self.record(span_line(statement, "startLine"), false),
        };
        match kind {
            "declare" => {
                let name = nested_str(statement, &["identifier", "name"]);
                let type_node = statement.get("typeNode").unwrap_or(&JsonValue::Null);
                let value = if str_field(type_node, "kind") == "array" {
                    self.declare_type(name, str_field(type_node, "elementType"));
                    let bounds = array_field(type_node, "dimensions")
                        .iter()
                        .map(|dim| (int_field(dim, "lower"), int_field(dim, "upper")))
                        .collect::<Vec<_>>();
                    let default = default_value(str_field(type_node, "elementType"));
                    Value::Array(Box::new(PseudoArray {
                        bounds,
                        default: Box::new(default),
                        store: HashMap::new(),
                    }))
                } else {
                    self.declare_type(name, str_field(type_node, "name"));
                    default_value(str_field(type_node, "name"))
                };
                self.assign_name(name, value);
                Ok(Flow::Continue)
            }
            "constant" => {
                let name = nested_str(statement, &["identifier", "name"]);
                let value = self.eval(required(statement, "value")?)?;
                self.declare_type(name, &value.type_name());
                self.assign_name(name, value);
                Ok(Flow::Continue)
            }
            "assignment" => {
                let value = self.eval(required(statement, "value")?)?;
                self.assign_target(required(statement, "target")?, value)?;
                Ok(Flow::Continue)
            }
            "input" => {
                let raw = self.read_input(statement)?;
                let target = required(statement, "target")?;
                let value = match self.target_type(statement) {
                    Some(type_name) => coerce_input(&raw, &type_name),
                    None => Value::String(raw),
                };
                self.assign_target(target, value)?;
                Ok(Flow::Continue)
            }
            "output" => {
                let mut line = String::new();
                for expr in array_field(statement, "values") {
                    line.push_str(&self.eval(expr)?.display());
                }
                self.output_lines += line.matches('\n').count() + 1;
                self.stdout.push(line);
                Ok(Flow::Continue)
            }
            "if" => {
                let taken = self.eval(required(statement, "condition")?)?.truthy();
                self.set_taken(if_test, taken);
                if taken {
                    self.exec_block(array_field(statement, "thenBody"))
                } else {
                    self.exec_block(array_field(statement, "elseBody"))
                }
            }
            "case" => {
                // The first option's test is recorded before the subject is evaluated, so an
                // error there stops on the CASE rather than on the statement before it.
                let clauses = array_field(statement, "clauses");
                let first_tested = clauses
                    .first()
                    .filter(|clause| !matches!(clause.get("value"), Some(JsonValue::Null) | None));
                let first_test = first_tested
                    .and_then(|clause| self.record(span_line(clause, "startLine"), true));
                let subject = self.eval(required(statement, "expression")?)?;
                for (index, clause) in clauses.iter().enumerate() {
                    let matches = match clause.get("value") {
                        Some(JsonValue::Null) | None => true,
                        Some(value_expr) => {
                            let test = if index > 0 || first_tested.is_none() {
                                self.record(span_line(clause, "startLine"), true)
                            } else {
                                first_test
                            };
                            let matches = values_equal(&subject, &self.eval(value_expr)?);
                            self.set_taken(test, matches);
                            matches
                        }
                    };
                    if matches {
                        return self.exec_statement(required(clause, "statement")?);
                    }
                }
                Ok(Flow::Continue)
            }
            "for" => {
                // The first test is recorded before the header is evaluated, so an error in its
                // bounds stops on the FOR.
                let line = span_line(statement, "startLine");
                self.record(line, true);
                let iterator = nested_str(statement, &["iterator", "name"]);
                let end = self.eval(required(statement, "endValue")?)?.to_i64();
                let step = match statement.get("stepValue") {
                    Some(JsonValue::Null) | None => 1,
                    Some(expr) => self.eval(expr)?.to_i64(),
                };
                if step == 0 {
                    return Err(RuntimeError::at(statement, "FOR STEP cannot be zero"));
                }
                let mut value = self.eval(required(statement, "startValue")?)?.to_i64();
                let mut first_test = true;
                loop {
                    if !first_test {
                        self.record(line, true);
                    }
                    first_test = false;
                    if (step > 0 && value > end) || (step < 0 && value < end) {
                        break;
                    }
                    // An empty body never reaches exec_statement or eval, so the loop itself
                    // must spend one budget step per iteration or it can spin forever.
                    self.step(statement)?;
                    self.assign_name(iterator, Value::Integer(value));
                    self.declare_type(iterator, "INTEGER");
                    if let flow @ Flow::Return(_) =
                        self.exec_block(array_field(statement, "body"))?
                    {
                        return Ok(flow);
                    }
                    value += step;
                }
                Ok(Flow::Continue)
            }
            "while" => {
                let line = span_line(statement, "startLine");
                while {
                    self.record(line, true);
                    self.eval(required(statement, "condition")?)?.truthy()
                } {
                    if let flow @ Flow::Return(_) =
                        self.exec_block(array_field(statement, "body"))?
                    {
                        return Ok(flow);
                    }
                }
                Ok(Flow::Continue)
            }
            "repeat" => {
                let condition = required(statement, "condition")?;
                let line = span_line(condition, "startLine");
                loop {
                    if let flow @ Flow::Return(_) =
                        self.exec_block(array_field(statement, "body"))?
                    {
                        return Ok(flow);
                    }
                    self.record(line, true);
                    if self.eval(condition)?.truthy() {
                        break;
                    }
                }
                Ok(Flow::Continue)
            }
            "callStatement" => {
                self.call_routine(
                    str_field(statement, "name"),
                    array_field(statement, "args"),
                    statement,
                )?;
                Ok(Flow::Continue)
            }
            "return" => Ok(Flow::Return(self.eval(required(statement, "value")?)?)),
            "openfile" => {
                let name = self.eval(required(statement, "fileIdentifier")?)?.display();
                let mode = str_field(statement, "mode");
                let pointer = if mode == "WRITE" {
                    self.virtual_files.insert(name.clone(), Vec::new());
                    0
                } else if mode == "APPEND" {
                    let len = self.virtual_files.entry(name.clone()).or_default().len();
                    len
                } else {
                    self.virtual_files.entry(name.clone()).or_default();
                    0
                };
                self.open_files.insert(
                    name,
                    FileHandle {
                        mode: mode.to_string(),
                        pointer,
                    },
                );
                Ok(Flow::Continue)
            }
            "readfile" => {
                let name = self.eval(required(statement, "fileIdentifier")?)?.display();
                let line = self.read_file(&name, statement)?;
                self.assign_target(required(statement, "target")?, Value::String(line))?;
                Ok(Flow::Continue)
            }
            "writefile" => {
                let name = self.eval(required(statement, "fileIdentifier")?)?.display();
                let value = self.eval(required(statement, "value")?)?.display();
                self.write_file(&name, value, statement)?;
                Ok(Flow::Continue)
            }
            "closefile" => {
                let name = self.eval(required(statement, "fileIdentifier")?)?.display();
                self.open_files.remove(&name);
                Ok(Flow::Continue)
            }
            _ => Ok(Flow::Continue),
        }
    }

    fn eval(&mut self, expression: &JsonValue) -> RuntimeResult<Value> {
        #[cfg(test)]
        if !self.use_prepared {
            return self.eval_reference(expression);
        }
        let key = expression as *const JsonValue as usize;
        let prepared = match self.prepared_expressions.get(&key) {
            Some(prepared) => prepared.clone(),
            None => {
                let prepared = Rc::new(Expression::new(expression, &mut self.symbols));
                self.prepared_expressions.insert(key, prepared.clone());
                prepared
            }
        };
        self.eval_prepared(&prepared)
    }

    fn eval_generic(&mut self, expression: &JsonValue) -> RuntimeResult<Value> {
        match str_field(expression, "kind") {
            "arrayAccess" => self.read_array(expression),
            "call" => self.call_function(
                str_field(expression, "name"),
                array_field(expression, "args"),
                expression,
            ),
            _ => Ok(Value::Null),
        }
    }

    fn call_function(
        &mut self,
        name: &str,
        args: &[JsonValue],
        source: &JsonValue,
    ) -> RuntimeResult<Value> {
        let upper = name.to_uppercase();
        match upper.as_str() {
            "DIV" => {
                let left = self.eval(&args[0])?.to_i64();
                let right = self.eval(&args[1])?.to_i64();
                if right == 0 {
                    return Err(RuntimeError::at(source, "Division by zero"));
                }
                return Ok(Value::Integer(left.div_euclid(right)));
            }
            "MOD" => {
                let left = self.eval(&args[0])?.to_i64();
                let right = self.eval(&args[1])?.to_i64();
                if right == 0 {
                    return Err(RuntimeError::at(source, "Modulo by zero"));
                }
                return Ok(Value::Integer(left.rem_euclid(right)));
            }
            "LENGTH" | "LEN" => {
                let value = self.eval(&args[0])?;
                return Ok(Value::Integer(match value {
                    Value::Array(array) => array
                        .bounds
                        .iter()
                        .map(|(lower, upper)| (upper - lower + 1).max(0))
                        .product(),
                    other => other.display().chars().count() as i64,
                }));
            }
            "LCASE" => return Ok(Value::String(self.eval(&args[0])?.display().to_lowercase())),
            "UCASE" => return Ok(Value::String(self.eval(&args[0])?.display().to_uppercase())),
            "SUBSTRING" => {
                let text = self.eval(&args[0])?.display();
                let start = self.eval(&args[1])?.to_i64().max(1) as usize - 1;
                let length = self.eval(&args[2])?.to_i64().max(0) as usize;
                return Ok(Value::String(
                    text.chars().skip(start).take(length).collect(),
                ));
            }
            "LEFT" => {
                let text = self.eval(&args[0])?.display();
                let length = self.eval(&args[1])?.to_i64().max(0) as usize;
                return Ok(Value::String(text.chars().take(length).collect()));
            }
            "RIGHT" => {
                let text = self.eval(&args[0])?.display();
                let length = self.eval(&args[1])?.to_i64().max(0) as usize;
                let count = text.chars().count();
                let skip = count.saturating_sub(length);
                return Ok(Value::String(text.chars().skip(skip).collect()));
            }
            "MID" => {
                let text = self.eval(&args[0])?.display();
                let start = self.eval(&args[1])?.to_i64().max(1) as usize - 1;
                let length = self.eval(&args[2])?.to_i64().max(0) as usize;
                return Ok(Value::String(
                    text.chars().skip(start).take(length).collect(),
                ));
            }
            "INT" => return Ok(Value::Integer(self.eval(&args[0])?.to_i64())),
            "STR" => return Ok(Value::String(self.eval(&args[0])?.display())),
            "FLOAT" => return Ok(Value::Real(self.eval(&args[0])?.to_f64())),
            "ASC" => {
                let text = self.eval(&args[0])?.display();
                return Ok(Value::Integer(
                    text.chars().next().map(|ch| ch as i64).unwrap_or(0),
                ));
            }
            "CHR" => {
                let code = self.eval(&args[0])?.to_i64() as u32;
                return Ok(Value::String(
                    char::from_u32(code).map(String::from).unwrap_or_default(),
                ));
            }
            "POSITION" => {
                let haystack = self.eval(&args[0])?.display();
                let needle = self.eval(&args[1])?.display();
                let position = haystack
                    .find(&needle)
                    .map(|index| index as i64 + 1)
                    .unwrap_or(0);
                return Ok(Value::Integer(position));
            }
            "RAND" => {
                let max = self.eval(&args[0])?.to_i64().max(0);
                self.rng_state = self
                    .rng_state
                    .wrapping_mul(6364136223846793005)
                    .wrapping_add(1);
                let value = if max == 0 {
                    0
                } else {
                    (self.rng_state >> 11) as i64 % (max + 1)
                };
                return Ok(Value::Integer(value));
            }
            "ROUND" => {
                let value = self.eval(&args[0])?.to_f64();
                let places = self.eval(&args[1])?.to_i64();
                let factor = 10_f64.powi(places as i32);
                return Ok(Value::Real((value * factor).round() / factor));
            }
            "RANDOM" => {
                self.rng_state = self
                    .rng_state
                    .wrapping_mul(6364136223846793005)
                    .wrapping_add(1);
                let value = ((self.rng_state >> 11) as f64) / ((1_u64 << 53) as f64);
                return Ok(Value::Real(value));
            }
            _ => {}
        }

        let Some(function) = self.functions.get(&name.to_lowercase()).cloned() else {
            return Err(RuntimeError::at(
                source,
                format!("Unknown function \"{name}\"."),
            ));
        };
        let flow = self.call_user_routine(&function, args, source)?;
        Ok(match flow {
            Flow::Return(value) => value,
            Flow::Continue => Value::Null,
        })
    }

    fn call_routine(
        &mut self,
        name: &str,
        args: &[JsonValue],
        source: &JsonValue,
    ) -> RuntimeResult<Flow> {
        let Some(procedure) = self.procedures.get(&name.to_lowercase()).cloned() else {
            return Err(RuntimeError::at(
                source,
                format!("Unknown procedure \"{name}\"."),
            ));
        };
        self.call_user_routine(&procedure, args, source)
    }

    fn call_user_routine(
        &mut self,
        routine: &JsonValue,
        args: &[JsonValue],
        source: &JsonValue,
    ) -> RuntimeResult<Flow> {
        let params = array_field(routine, "params");
        if params.len() != args.len() {
            return Err(RuntimeError::at(source, "Routine argument count mismatch"));
        }

        let mut scope = HashMap::new();
        let mut type_scope = HashMap::new();
        for (param, arg) in params.iter().zip(args.iter()) {
            let id = prepared::symbol(&mut self.symbols, str_field(param, "name"));
            let type_name = nested_str(param, &["typeNode", "name"]);
            scope.insert(id, self.eval(arg)?);
            if !type_name.is_empty() {
                type_scope.insert(id, Rc::from(type_name));
            }
        }
        self.scopes.push(scope);
        self.type_scopes.push(type_scope);
        self.record(span_line(routine, "startLine"), false);
        let flow = self.exec_block(array_field(routine, "body"));
        if flow.is_ok() {
            self.record(span_line(routine, "endLine"), false);
        }
        self.type_scopes.pop();
        self.scopes.pop();
        flow
    }

    fn assign_target(&mut self, target: &JsonValue, value: Value) -> RuntimeResult<()> {
        match str_field(target, "kind") {
            "identifier" => {
                self.assign_name(str_field(target, "name"), value);
                Ok(())
            }
            "arrayAccess" => self.write_array(target, value),
            _ => Err(RuntimeError::at(target, "Invalid assignment target")),
        }
    }

    fn assign_name(&mut self, name: &str, value: Value) {
        let id = prepared::symbol(&mut self.symbols, name);
        self.assign_slot(id, value);
    }

    #[inline]
    fn assign_slot(&mut self, id: Symbol, value: Value) {
        if self.scopes.is_empty() {
            if self.globals.len() <= id {
                self.globals.resize(id + 1, None);
            }
            self.globals[id] = Some(value);
            return;
        }
        for scope in self.scopes.iter_mut().rev() {
            if let Some(slot) = scope.get_mut(&id) {
                *slot = value;
                return;
            }
        }
        if let Some(slot @ Some(_)) = self.globals.get_mut(id) {
            *slot = Some(value);
        } else if let Some(scope) = self.scopes.last_mut() {
            scope.insert(id, value);
        } else {
            if self.globals.len() <= id {
                self.globals.resize(id + 1, None);
            }
            self.globals[id] = Some(value);
        }
    }

    #[inline]
    fn lookup_slot(&self, id: Symbol) -> Option<&Value> {
        if self.scopes.is_empty() {
            return self.globals.get(id).and_then(Option::as_ref);
        }
        self.scopes
            .iter()
            .rev()
            .find_map(|scope| scope.get(&id))
            .or_else(|| self.globals.get(id).and_then(Option::as_ref))
    }

    fn lookup_ref(&self, name: &str) -> Option<&Value> {
        self.symbols
            .get(&name.to_lowercase())
            .and_then(|id| self.lookup_slot(*id))
    }

    fn declare_type(&mut self, name: &str, type_name: &str) {
        let id = prepared::symbol(&mut self.symbols, name);
        self.declare_type_slot(id, &Rc::from(type_name));
    }

    fn declare_type_slot(&mut self, id: Symbol, type_name: &Rc<str>) {
        if let Some(scope) = self.type_scopes.last_mut() {
            scope.insert(id, type_name.clone());
        } else {
            if self.global_types.len() <= id {
                self.global_types.resize(id + 1, None);
            }
            if !self.global_types[id]
                .as_ref()
                .is_some_and(|current| Rc::ptr_eq(current, type_name))
            {
                self.global_types[id] = Some(type_name.clone());
            }
        }
    }

    fn lookup_type(&self, name: &str) -> Option<Rc<str>> {
        let id = *self.symbols.get(&name.to_lowercase())?;
        self.type_scopes
            .iter()
            .rev()
            .find_map(|scope| scope.get(&id))
            .or_else(|| self.global_types.get(id).and_then(Option::as_ref))
            .cloned()
    }

    fn read_array(&mut self, target: &JsonValue) -> RuntimeResult<Value> {
        let name = str_field(target, "name");
        let indices = self.indices(target)?;
        match self.lookup_ref(name) {
            Some(Value::Array(array)) => array
                .get(&indices)
                .ok_or_else(|| RuntimeError::at(target, "Index out of declared range")),
            _ => Err(RuntimeError::at(
                target,
                format!("\"{name}\" is not an array"),
            )),
        }
    }

    fn write_array(&mut self, target: &JsonValue, value: Value) -> RuntimeResult<()> {
        let name = str_field(target, "name");
        let id = prepared::symbol(&mut self.symbols, name);
        let indices = self.indices(target)?;
        for scope in self.scopes.iter_mut().rev() {
            if let Some(Value::Array(array)) = scope.get_mut(&id) {
                return array
                    .set(indices, value)
                    .map_err(|message| RuntimeError::at(target, message));
            }
        }
        if let Some(Some(Value::Array(array))) = self.globals.get_mut(id) {
            return array
                .set(indices, value)
                .map_err(|message| RuntimeError::at(target, message));
        }
        let bounds = indices
            .iter()
            .map(|&index| {
                let lower = if index < 0 { index } else { 0 };
                (lower, index.max(1023))
            })
            .collect::<Vec<_>>();
        let mut array = PseudoArray {
            bounds,
            default: Box::new(default_value(&value.type_name())),
            store: HashMap::new(),
        };
        array
            .set(indices, value)
            .map_err(|message| RuntimeError::at(target, message))?;
        self.assign_name(name, Value::Array(Box::new(array)));
        Ok(())
    }

    fn indices(&mut self, target: &JsonValue) -> RuntimeResult<Vec<i64>> {
        array_field(target, "indices")
            .iter()
            .map(|expr| Ok(self.eval(expr)?.to_i64()))
            .collect()
    }

    fn read_input(&mut self, source: &JsonValue) -> RuntimeResult<String> {
        if self.stdin_cursor >= self.stdin_lines.len() {
            return Err(RuntimeError::at(
                source,
                "INPUT requested but no stdin lines remain",
            ));
        }
        let value = self.stdin_lines[self.stdin_cursor].clone();
        self.stdin_cursor += 1;
        Ok(value)
    }

    fn target_type(&self, statement: &JsonValue) -> Option<Rc<str>> {
        let target = statement.get("target")?;
        match str_field(target, "kind") {
            "identifier" | "arrayAccess" => self.lookup_type(str_field(target, "name")),
            _ => None,
        }
    }

    fn read_file(&mut self, name: &str, source: &JsonValue) -> RuntimeResult<String> {
        let handle = self
            .open_files
            .get_mut(name)
            .ok_or_else(|| RuntimeError::at(source, format!("File {name} is not open")))?;
        if handle.mode != "READ" {
            return Err(RuntimeError::at(
                source,
                format!("File {name} not opened in READ mode"),
            ));
        }
        let Some(line) = self
            .virtual_files
            .get(name)
            .and_then(|data| data.get(handle.pointer))
        else {
            return Ok(String::new());
        };
        handle.pointer += 1;
        Ok(line.clone())
    }

    fn write_file(&mut self, name: &str, value: String, source: &JsonValue) -> RuntimeResult<()> {
        let handle = self
            .open_files
            .get(name)
            .ok_or_else(|| RuntimeError::at(source, format!("File {name} is not open")))?;
        if handle.mode != "WRITE" && handle.mode != "APPEND" {
            return Err(RuntimeError::at(
                source,
                format!("File {name} not opened in WRITE mode"),
            ));
        }
        self.virtual_files
            .entry(name.to_string())
            .or_default()
            .push(value);
        Ok(())
    }

    /// Adds a step to the trace, returning its index so a test can be given its result.
    #[inline]
    fn record(&mut self, line: usize, test: bool) -> Option<usize> {
        if self.trace_truncated {
            return None;
        }
        let output = self.output_lines;
        let trace = self.trace.as_mut()?;
        if trace.len() < MAX_TRACE_STEPS {
            trace.push(TraceStep {
                line,
                test,
                output,
                taken: None,
            });
            Some(trace.len() - 1)
        } else {
            self.trace_truncated = true;
            None
        }
    }

    /// Records which way an IF or CASE option went, so the replay can follow the branch taken
    /// even when neither branch runs a statement.
    fn set_taken(&mut self, step: Option<usize>, taken: bool) {
        if let (Some(index), Some(trace)) = (step, self.trace.as_mut()) {
            if let Some(step) = trace.get_mut(index) {
                step.taken = Some(taken);
            }
        }
    }

    #[inline]
    fn step_at(&mut self, source: Location) -> RuntimeResult<()> {
        if self.remaining_steps == 0 {
            return Err(source.error("Instruction budget exceeded."));
        }
        self.remaining_steps -= 1;
        Ok(())
    }

    fn step(&mut self, source: &JsonValue) -> RuntimeResult<()> {
        if self.remaining_steps == 0 {
            return Err(RuntimeError::at(source, "Instruction budget exceeded."));
        }
        self.remaining_steps -= 1;
        Ok(())
    }
}

impl PseudoArray {
    fn norm(&self, indices: &[i64]) -> Result<Vec<i64>, String> {
        if indices.len() != self.bounds.len() {
            return Err("Incorrect index dimensions".to_string());
        }
        for (value, (lower, upper)) in indices.iter().zip(self.bounds.iter()) {
            if value < lower || value > upper {
                return Err("Index out of declared range".to_string());
            }
        }
        Ok(indices.to_vec())
    }

    fn get(&self, indices: &[i64]) -> Option<Value> {
        let key = self.norm(indices).ok()?;
        Some(
            self.store
                .get(&key)
                .cloned()
                .unwrap_or_else(|| (*self.default).clone()),
        )
    }

    fn set(&mut self, indices: Vec<i64>, value: Value) -> Result<(), String> {
        let key = self.norm(&indices)?;
        self.store.insert(key, value);
        Ok(())
    }
}

impl Value {
    fn display(&self) -> String {
        match self {
            Value::Integer(value) => value.to_string(),
            Value::Real(value) => {
                let text = value.to_string();
                if text == "-0" {
                    "0".to_string()
                } else {
                    text
                }
            }
            Value::String(value) => value.clone(),
            Value::Boolean(value) => {
                if *value {
                    "True".to_string()
                } else {
                    "False".to_string()
                }
            }
            Value::Array(_) => "[array]".to_string(),
            Value::Null => "None".to_string(),
        }
    }

    fn truthy(&self) -> bool {
        match self {
            Value::Boolean(value) => *value,
            Value::Integer(value) => *value != 0,
            Value::Real(value) => *value != 0.0,
            Value::String(value) => !value.is_empty(),
            Value::Array(_) => true,
            Value::Null => false,
        }
    }

    fn to_i64(&self) -> i64 {
        match self {
            Value::Integer(value) => *value,
            Value::Real(value) => *value as i64,
            Value::Boolean(value) => i64::from(*value),
            Value::String(value) => value.trim().parse::<i64>().unwrap_or(0),
            _ => 0,
        }
    }

    fn to_f64(&self) -> f64 {
        match self {
            Value::Integer(value) => *value as f64,
            Value::Real(value) => *value,
            Value::Boolean(value) => {
                if *value {
                    1.0
                } else {
                    0.0
                }
            }
            Value::String(value) => value.trim().parse::<f64>().unwrap_or(0.0),
            _ => 0.0,
        }
    }

    fn type_name(&self) -> String {
        match self {
            Value::Integer(_) => "INTEGER",
            Value::Real(_) => "REAL",
            Value::String(value) if value.chars().count() <= 1 => "CHAR",
            Value::String(_) => "STRING",
            Value::Boolean(_) => "BOOLEAN",
            Value::Array(array) => return array.default.type_name(),
            Value::Null => "STRING",
        }
        .to_string()
    }
}

impl RuntimeError {
    fn new(message: impl Into<String>, line: usize, column: usize) -> Self {
        Self {
            message: message.into(),
            line,
            column,
        }
    }

    fn at(source: &JsonValue, message: impl Into<String>) -> Self {
        let span = source.get("span").unwrap_or(&JsonValue::Null);
        Self::new(
            message,
            span.get("startLine")
                .and_then(JsonValue::as_u64)
                .unwrap_or(1) as usize,
            span.get("startColumn")
                .and_then(JsonValue::as_u64)
                .unwrap_or(1) as usize,
        )
    }
}

fn is_text(value: &Value) -> bool {
    matches!(value, Value::String(_))
}

fn default_value(type_name: &str) -> Value {
    match type_name {
        "INTEGER" => Value::Integer(0),
        "REAL" => Value::Real(0.0),
        "BOOLEAN" => Value::Boolean(false),
        _ => Value::String(String::new()),
    }
}

fn coerce_input(value: &str, type_name: &str) -> Value {
    match type_name {
        "INTEGER" => Value::Integer(value.trim().parse().unwrap_or(0)),
        "REAL" => Value::Real(value.trim().parse().unwrap_or(0.0)),
        "BOOLEAN" => Value::Boolean(value.trim().eq_ignore_ascii_case("TRUE")),
        "CHAR" => Value::String(
            value
                .chars()
                .next()
                .map(|char| char.to_string())
                .unwrap_or_default(),
        ),
        _ => Value::String(value.to_string()),
    }
}

fn numeric_result(
    left: &Value,
    right: &Value,
    value: f64,
    force_real_for_fractional: bool,
) -> Value {
    if !force_real_for_fractional
        && matches!(left, Value::Integer(_))
        && matches!(right, Value::Integer(_))
    {
        Value::Integer(value as i64)
    } else {
        Value::Real(value)
    }
}

fn values_equal(left: &Value, right: &Value) -> bool {
    match (left, right) {
        (Value::String(a), Value::String(b)) => a == b,
        (Value::Boolean(a), Value::Boolean(b)) => a == b,
        (Value::Integer(a), Value::Integer(b)) => a == b,
        (Value::Real(a), Value::Real(b)) => (a - b).abs() < f64::EPSILON,
        (Value::Integer(_), Value::Real(_)) | (Value::Real(_), Value::Integer(_)) => {
            (left.to_f64() - right.to_f64()).abs() < f64::EPSILON
        }
        _ => left.display() == right.display(),
    }
}

fn compare_values(left: &Value, right: &Value, compare: impl Fn(f64, f64) -> bool) -> bool {
    match (left, right) {
        (Value::String(a), Value::String(b)) => compare_order(a, b, compare),
        _ => compare(left.to_f64(), right.to_f64()),
    }
}

fn compare_order(left: &str, right: &str, compare: impl Fn(f64, f64) -> bool) -> bool {
    let ordering = if left < right {
        -1.0
    } else if left > right {
        1.0
    } else {
        0.0
    };
    compare(ordering, 0.0)
}

fn required<'a>(value: &'a JsonValue, key: &str) -> RuntimeResult<&'a JsonValue> {
    value
        .get(key)
        .ok_or_else(|| RuntimeError::at(value, format!("Missing AST field \"{key}\"")))
}

fn span_line(value: &JsonValue, key: &str) -> usize {
    value
        .get("span")
        .and_then(|span| span.get(key))
        .and_then(JsonValue::as_u64)
        .unwrap_or(1) as usize
}

fn str_field<'a>(value: &'a JsonValue, key: &str) -> &'a str {
    value.get(key).and_then(JsonValue::as_str).unwrap_or("")
}

fn nested_str<'a>(value: &'a JsonValue, path: &[&str]) -> &'a str {
    let mut current = value;
    for key in path {
        current = current.get(*key).unwrap_or(&JsonValue::Null);
    }
    current.as_str().unwrap_or("")
}

fn int_field(value: &JsonValue, key: &str) -> i64 {
    value.get(key).and_then(JsonValue::as_i64).unwrap_or(0)
}

fn array_field<'a>(value: &'a JsonValue, key: &str) -> &'a [JsonValue] {
    value
        .get(key)
        .and_then(JsonValue::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

pub fn run_ast_json(
    ast_json: &str,
    stdin_lines: Vec<String>,
    virtual_files: HashMap<String, Vec<String>>,
    instruction_budget: Option<usize>,
) -> RunResult {
    let input = RunInput {
        ast_json: ast_json.to_string(),
        stdin_lines,
        virtual_files,
        instruction_budget,
        trace: false,
    };
    match Runtime::new(input) {
        Ok(runtime) => runtime.run(),
        Err(error) => RunResult {
            success: false,
            stdout: String::new(),
            stderr: error.message.clone(),
            diagnostics: vec![Diagnostic {
                code: "RUN500".to_string(),
                message: error.message,
                severity: "error".to_string(),
                line: error.line,
                column: error.column,
                end_line: error.line,
                end_column: error.column,
                hint: None,
            }],
            virtual_files: HashMap::new(),
            trace: None,
            trace_truncated: false,
        },
    }
}

#[wasm_bindgen]
pub fn run_pseudocode(request_json: &str) -> String {
    let result = match serde_json::from_str::<RunInput>(request_json) {
        Ok(input) => match Runtime::new(input) {
            Ok(runtime) => runtime.run(),
            Err(error) => RunResult {
                success: false,
                stdout: String::new(),
                stderr: error.message.clone(),
                diagnostics: vec![Diagnostic {
                    code: "RUN500".to_string(),
                    message: error.message,
                    severity: "error".to_string(),
                    line: error.line,
                    column: error.column,
                    end_line: error.line,
                    end_column: error.column,
                    hint: None,
                }],
                virtual_files: HashMap::new(),
                trace: None,
                trace_truncated: false,
            },
        },
        Err(error) => RunResult {
            success: false,
            stdout: String::new(),
            stderr: format!("Invalid runtime request: {error}"),
            diagnostics: vec![Diagnostic {
                code: "RUN500".to_string(),
                message: format!("Invalid runtime request: {error}"),
                severity: "error".to_string(),
                line: 1,
                column: 1,
                end_line: 1,
                end_column: 1,
                hint: None,
            }],
            virtual_files: HashMap::new(),
            trace: None,
            trace_truncated: false,
        },
    };
    serde_json::to_string(&result).unwrap_or_else(|error| {
        json!({
            "success": false,
            "stdout": "",
            "stderr": format!("Failed to serialize runtime result: {error}"),
            "diagnostics": [],
            "virtualFiles": {}
        })
        .to_string()
    })
}

#[wasm_bindgen]
pub fn runtime_ready() -> bool {
    true
}

#[allow(dead_code)]
fn object_from_pairs(pairs: Vec<(&str, JsonValue)>) -> JsonValue {
    JsonValue::Object(Map::from_iter(
        pairs
            .into_iter()
            .map(|(key, value)| (key.to_string(), value)),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;

    fn span() -> JsonValue {
        json!({"startLine": 1, "startColumn": 1, "endLine": 1, "endColumn": 1})
    }

    fn program(body: Vec<JsonValue>) -> String {
        json!({"kind": "program", "body": body, "span": span()}).to_string()
    }

    fn ident(name: &str) -> JsonValue {
        json!({"kind": "identifier", "name": name, "span": span()})
    }

    fn int(value: i64) -> JsonValue {
        json!({"kind": "literal", "value": value, "literalType": "INTEGER", "span": span()})
    }

    fn string(value: &str) -> JsonValue {
        json!({"kind": "literal", "value": value, "literalType": "STRING", "span": span()})
    }

    fn declare(name: &str, type_name: &str) -> JsonValue {
        json!({"kind":"declare","identifier":ident(name),"typeNode":{"kind":"basic","name":type_name,"span":span()},"span":span()})
    }

    fn run(ast_json: String) -> RunResult {
        run_ast_json(&ast_json, Vec::new(), HashMap::new(), Some(10_000))
    }

    fn assert_prepared_matches_reference(body: Vec<JsonValue>) {
        for trace in [false, true] {
            for budget in [0, 1, 2, 4, 8, 20, 1_000, 100_000] {
                let input = RunInput {
                    ast_json: program(body.clone()),
                    stdin_lines: vec!["12".to_string(), "not a number".to_string()],
                    virtual_files: HashMap::new(),
                    instruction_budget: Some(budget),
                    trace,
                };
                let prepared = Runtime::new(input.clone()).unwrap();
                let mut reference = Runtime::new(input).unwrap();
                reference.use_prepared = false;
                assert_eq!(
                    serde_json::to_value(prepared.run()).unwrap(),
                    serde_json::to_value(reference.run()).unwrap(),
                    "trace={trace}, budget={budget}"
                );
            }
        }
    }

    #[test]
    fn prepared_operators_match_reference_including_errors_and_short_circuits() {
        let pairs = [
            (int(-17), int(5)),
            (int(17), int(-5)),
            (
                json!({"kind":"literal","literalType":"REAL","value":2.5,"span":at(2)}),
                int(-2),
            ),
            (int(0), int(0)),
            (string("ab"), string("cd")),
            (string("12"), int(3)),
            (int(9_007_199_254_740_992), int(1)),
        ];
        for operator in [
            "+", "-", "*", "/", "DIV", "MOD", "^", "=", "<>", "<", "<=", ">", ">=", "AND", "OR",
        ] {
            for (left, right) in &pairs {
                assert_prepared_matches_reference(vec![
                    json!({"kind":"output","values":[{"kind":"binary","operator":operator,"left":left,"right":right,"span":at(3)}],"span":at(4)}),
                ]);
            }
        }
        for value in [true, false] {
            for operator in ["AND", "OR"] {
                assert_prepared_matches_reference(vec![
                    json!({"kind":"output","values":[{"kind":"binary","operator":operator,"left":{"kind":"literal","literalType":"BOOLEAN","value":value,"span":at(5)},"right":ident("Missing"),"span":at(6)}],"span":at(7)}),
                ]);
            }
        }
    }

    #[test]
    fn prepared_loops_return_and_traces_match_reference_at_budget_boundaries() {
        let increment = json!({"kind":"assignment","target":ident("Count"),"value":{"kind":"binary","operator":"+","left":ident("Count"),"right":int(1),"span":at(3)},"span":at(3)});
        let condition = json!({"kind":"binary","operator":">=","left":ident("Count"),"right":int(3),"span":at(6)});
        assert_prepared_matches_reference(vec![
            declare("Count", "INTEGER"),
            json!({"kind":"for","iterator":ident("Index"),"startValue":int(3),"endValue":int(-1),"stepValue":int(-2),"body":[increment.clone()],"span":at(2)}),
            json!({"kind":"repeat","body":[increment.clone()],"condition":condition,"span":lines(4,6)}),
            json!({"kind":"while","condition":{"kind":"binary","operator":"<","left":ident("Count"),"right":int(6000),"span":at(7)},"body":[increment],"span":at(7)}),
            json!({"kind":"output","values":[ident("Count")],"span":at(8)}),
        ]);
        assert_prepared_matches_reference(vec![
            json!({"kind":"functionDefinition","name":"First","params":[],"body":[{"kind":"for","iterator":ident("Index"),"startValue":int(1),"endValue":int(5),"body":[{"kind":"return","value":ident("Index"),"span":at(3)}],"span":at(2)}],"span":lines(1,4)}),
            json!({"kind":"output","values":[{"kind":"call","name":"First","args":[],"span":at(5)}],"span":at(5)}),
        ]);
        // An invalid REPEAT must report its missing condition before running the body.
        assert_prepared_matches_reference(vec![
            json!({"kind":"repeat","body":[{"kind":"output","values":[string("unreachable")],"span":at(2)}],"span":at(1)}),
        ]);
    }

    #[test]
    fn prepared_routine_frames_preserve_parameter_order_and_global_updates() {
        let mut body = (0..500)
            .map(|index| declare(&format!("Global{index}"), "INTEGER"))
            .collect::<Vec<_>>();
        body.extend([
            declare("A", "INTEGER"),
            declare("Z", "INTEGER"),
            json!({"kind":"functionDefinition","name":"Sum","params":[{"name":"Z","typeNode":{"name":"INTEGER"}},{"name":"A","typeNode":{"name":"INTEGER"}}],"body":[{"kind":"assignment","target":ident("Global1"),"value":int(9),"span":at(2)},{"kind":"return","value":{"kind":"binary","operator":"+","left":ident("z"),"right":ident("a"),"span":at(3)},"span":at(3)}],"span":lines(1,4)}),
            json!({"kind":"for","iterator":ident("Index"),"startValue":int(1),"endValue":int(10),"body":[{"kind":"output","values":[{"kind":"call","name":"SUM","args":[int(2),int(3)],"span":at(6)}],"span":at(6)}],"span":at(5)}),
            json!({"kind":"output","values":[ident("GLOBAL1"),string(","),ident("A"),string(","),ident("Z")],"span":at(7)}),
        ]);
        assert_prepared_matches_reference(body);
    }

    #[test]
    fn prepared_for_resets_the_iterator_type_when_the_body_redeclares_it() {
        assert_prepared_matches_reference(vec![
            json!({"kind":"for","iterator":ident("Index"),"startValue":int(1),"endValue":int(2),"body":[
                {"kind":"input","target":ident("INDEX"),"span":at(2)},
                {"kind":"output","values":[ident("Index")],"span":at(3)},
                {"kind":"declare","identifier":ident("index"),"typeNode":{"kind":"basic","name":"STRING"},"span":at(4)}
            ],"span":lines(1,5)}),
        ]);
    }

    #[test]
    fn executes_arithmetic_and_loops() {
        let ast = program(vec![
            declare("Total", "INTEGER"),
            json!({"kind":"for","iterator":ident("Index"),"startValue":int(1),"endValue":int(3),"stepValue":JsonValue::Null,"body":[
                {"kind":"assignment","target":ident("Total"),"value":{"kind":"binary","operator":"+","left":ident("Total"),"right":ident("Index"),"span":span()},"span":span()}
            ],"span":span()}),
            json!({"kind":"output","values":[ident("Total")],"span":span()}),
        ]);
        let result = run(ast);
        assert!(result.success, "{}", result.stderr);
        assert_eq!(result.stdout, "6");
    }

    #[test]
    fn supports_arrays() {
        let ast = program(vec![
            json!({"kind":"declare","identifier":ident("A"),"typeNode":{"kind":"array","elementType":"INTEGER","dimensions":[{"lower":1,"upper":2}],"span":span()},"span":span()}),
            json!({"kind":"assignment","target":{"kind":"arrayAccess","name":"A","indices":[int(2)],"span":span()},"value":int(9),"span":span()}),
            json!({"kind":"output","values":[{"kind":"arrayAccess","name":"A","indices":[int(2)],"span":span()}],"span":span()}),
        ]);
        let result = run(ast);
        assert!(result.success, "{}", result.stderr);
        assert_eq!(result.stdout, "9");
    }

    #[test]
    fn array_reads_keep_value_copies_bounds_and_case_insensitive_lookup() {
        let access = |name: &str, index: i64| json!({"kind":"arrayAccess","name":name,"indices":[int(index)],"span":span()});
        let ast = program(vec![
            json!({"kind":"declare","identifier":ident("Data"),"typeNode":{"kind":"array","elementType":"INTEGER","dimensions":[{"lower":-1,"upper":1}]},"span":span()}),
            json!({"kind":"assignment","target":access("DATA", -1),"value":int(7),"span":span()}),
            json!({"kind":"assignment","target":ident("Copy"),"value":ident("data"),"span":span()}),
            json!({"kind":"assignment","target":access("copy", -1),"value":int(9),"span":span()}),
            json!({"kind":"output","values":[access("dAtA", -1), string(","), access("Copy", -1), string(","), access("DATA", 0)],"span":span()}),
            json!({"kind":"output","values":[access("Data", 2)],"span":span()}),
        ]);
        let result = run(ast);
        assert!(!result.success);
        assert_eq!(result.stdout, "7,9,0");
        assert_eq!(result.stderr, "Index out of declared range");
    }

    #[test]
    fn supports_functions() {
        let ast = program(vec![
            json!({"kind":"functionDefinition","name":"AddOne","params":[{"name":"X","typeNode":{"kind":"basic","name":"INTEGER","span":span()},"span":span()}],"returnType":"INTEGER","body":[
                {"kind":"return","value":{"kind":"binary","operator":"+","left":ident("X"),"right":int(1),"span":span()},"span":span()}
            ],"span":span()}),
            json!({"kind":"output","values":[{"kind":"call","name":"AddOne","args":[int(4)],"span":span()}],"span":span()}),
        ]);
        let result = run(ast);
        assert!(result.success, "{}", result.stderr);
        assert_eq!(result.stdout, "5");
    }

    #[test]
    fn supports_file_io() {
        let ast = program(vec![
            json!({"kind":"openfile","fileIdentifier":string("A.txt"),"mode":"WRITE","span":span()}),
            json!({"kind":"writefile","fileIdentifier":string("A.txt"),"value":string("hello"),"span":span()}),
            json!({"kind":"closefile","fileIdentifier":string("A.txt"),"span":span()}),
        ]);
        let result = run(ast);
        assert!(result.success, "{}", result.stderr);
        assert_eq!(
            result.virtual_files.get("A.txt"),
            Some(&vec!["hello".to_string()])
        );
    }

    #[test]
    fn reads_files_in_order_then_returns_empty_at_eof() {
        let ast = program(vec![
            json!({"kind":"openfile","fileIdentifier":string("data.txt"),"mode":"READ","span":span()}),
            json!({"kind":"for","iterator":ident("Index"),"startValue":int(1),"endValue":int(4),"body":[
                {"kind":"readfile","fileIdentifier":string("data.txt"),"target":ident("Line"),"span":span()},
                {"kind":"output","values":[ident("Line")],"span":span()}
            ],"span":span()}),
        ]);
        let files = HashMap::from([(
            "data.txt".to_string(),
            vec!["first".to_string(), "second".to_string()],
        )]);
        let result = run_ast_json(&ast, Vec::new(), files.clone(), Some(100));
        assert!(result.success, "{}", result.stderr);
        assert_eq!(result.stdout, "first\nsecond\n\n");
        assert_eq!(result.virtual_files, files);
    }

    fn at(line: usize) -> JsonValue {
        json!({"startLine": line, "startColumn": 1, "endLine": line, "endColumn": 1})
    }

    fn lines(start: usize, end: usize) -> JsonValue {
        json!({"startLine": start, "startColumn": 1, "endLine": end, "endColumn": 1})
    }

    fn traced(ast_json: String) -> JsonValue {
        let request =
            json!({"ast_json": ast_json, "stdin_lines": [], "virtual_files": {}, "trace": true});
        serde_json::from_str(&run_pseudocode(&request.to_string())).expect("result JSON")
    }

    fn trace_of(result: &JsonValue) -> Vec<(u64, bool, u64)> {
        result["trace"]
            .as_array()
            .expect("trace")
            .iter()
            .map(|step| {
                (
                    step["line"].as_u64().unwrap(),
                    step["test"].as_bool().unwrap_or(false),
                    step["output"].as_u64().unwrap(),
                )
            })
            .collect()
    }

    #[test]
    fn traces_each_statement_and_condition_test() {
        let output = |line: usize, text: &str| json!({"kind":"output","values":[string(text)],"span":at(line)});
        let ast = json!({"kind":"program","span":span(),"body":[
            {"kind":"declare","identifier":ident("Count"),"typeNode":{"kind":"basic","name":"INTEGER","span":span()},"span":at(1)},
            {"kind":"for","iterator":ident("Index"),"startValue":int(1),"endValue":int(2),"stepValue":JsonValue::Null,"body":[output(3, "loop")],"span":lines(2, 4)},
            {"kind":"repeat","body":[
                {"kind":"assignment","target":ident("Count"),"value":{"kind":"binary","operator":"+","left":ident("Count"),"right":int(1),"span":span()},"span":at(6)}
            ],"condition":{"kind":"binary","operator":">=","left":ident("Count"),"right":int(2),"span":at(7)},"span":lines(5, 7)},
            {"kind":"case","expression":ident("Count"),"clauses":[
                {"value":int(1),"statement":output(9, "one"),"span":at(9)},
                {"value":int(2),"statement":output(10, "two"),"span":at(10)},
                {"value":JsonValue::Null,"statement":output(11, "other"),"span":at(11)}
            ],"span":lines(8, 12)},
            {"kind":"if","condition":{"kind":"literal","value":false,"literalType":"BOOLEAN","span":span()},"thenBody":[],"elseBody":[output(15, "else")],"span":lines(13, 16)}
        ]})
        .to_string();

        let result = traced(ast);
        assert_eq!(result["success"], true, "{}", result["stderr"]);
        assert_eq!(
            trace_of(&result),
            vec![
                (1, false, 0),
                (2, true, 0),
                (3, false, 0),
                (2, true, 1),
                (3, false, 1),
                (2, true, 2),
                (6, false, 2),
                (7, true, 2),
                (6, false, 2),
                (7, true, 2),
                (9, true, 2),
                (10, true, 2),
                (10, false, 2),
                (13, true, 3),
                (15, false, 3),
            ]
        );
        assert!(result.get("traceTruncated").is_none());
    }

    #[test]
    fn traces_entering_and_leaving_routines() {
        let ast = json!({"kind":"program","span":span(),"body":[
            {"kind":"procedureDefinition","name":"Greet","params":[],"body":[
                {"kind":"output","values":[string("hi")],"span":at(2)}
            ],"span":lines(1, 3)},
            {"kind":"callStatement","name":"Greet","args":[],"span":at(4)},
            {"kind":"output","values":[string("bye")],"span":at(5)}
        ]})
        .to_string();

        let result = traced(ast);
        assert_eq!(result["success"], true, "{}", result["stderr"]);
        assert_eq!(
            trace_of(&result),
            vec![
                (4, false, 0),
                (1, false, 0),
                (2, false, 0),
                (3, false, 1),
                (5, false, 1)
            ]
        );
    }

    #[test]
    fn keeps_the_first_steps_of_a_long_trace() {
        let ast = json!({"kind":"program","span":span(),"body":[
            {"kind":"for","iterator":ident("Index"),"startValue":int(1),"endValue":int(10_000),"stepValue":JsonValue::Null,"body":[],"span":lines(1, 2)}
        ]})
        .to_string();

        let result = traced(ast);
        assert_eq!(result["success"], true, "{}", result["stderr"]);
        assert_eq!(result["trace"].as_array().unwrap().len(), MAX_TRACE_STEPS);
        assert_eq!(result["traceTruncated"], true);
    }

    #[test]
    fn ends_the_trace_on_a_block_header_that_fails() {
        let divide_by_zero =
            || json!({"kind":"binary","operator":"DIV","left":int(1),"right":int(0),"span":span()});
        let for_ast = json!({"kind":"program","span":span(),"body":[
            {"kind":"output","values":[string("before")],"span":at(1)},
            {"kind":"for","iterator":ident("Index"),"startValue":int(1),"endValue":divide_by_zero(),"stepValue":JsonValue::Null,"body":[],"span":lines(2, 3)}
        ]})
        .to_string();
        let case_ast = json!({"kind":"program","span":span(),"body":[
            {"kind":"output","values":[string("before")],"span":at(1)},
            {"kind":"case","expression":divide_by_zero(),"clauses":[
                {"value":int(1),"statement":{"kind":"output","values":[string("one")],"span":at(3)},"span":at(3)}
            ],"span":lines(2, 4)}
        ]})
        .to_string();

        for (ast, failing_line) in [(for_ast, 2), (case_ast, 3)] {
            let result = traced(ast);
            assert_eq!(result["success"], false);
            assert_eq!(
                trace_of(&result),
                vec![(1, false, 0), (failing_line, true, 1)]
            );
        }
    }

    #[test]
    fn counts_output_in_lines_of_stdout() {
        let ast = json!({"kind":"program","span":span(),"body":[
            {"kind":"output","values":[string("a\nb")],"span":at(1)},
            {"kind":"output","values":[string("c")],"span":at(2)},
            {"kind":"output","values":[string("d")],"span":at(3)}
        ]})
        .to_string();

        let result = traced(ast);
        assert_eq!(result["stdout"], "a\nb\nc\nd");
        assert_eq!(
            trace_of(&result),
            vec![(1, false, 0), (2, false, 2), (3, false, 3)]
        );
    }

    #[test]
    fn records_which_way_each_if_and_case_option_went() {
        let ast = json!({"kind":"program","span":span(),"body":[
            {"kind":"if","condition":{"kind":"literal","value":false,"literalType":"BOOLEAN","span":span()},"thenBody":[],"elseBody":[],"span":lines(1, 3)},
            {"kind":"case","expression":int(2),"clauses":[
                {"value":int(1),"statement":{"kind":"output","values":[string("one")],"span":at(5)},"span":at(5)},
                {"value":int(2),"statement":{"kind":"output","values":[string("two")],"span":at(6)},"span":at(6)}
            ],"span":lines(4, 7)}
        ]})
        .to_string();

        let result = traced(ast);
        let taken: Vec<JsonValue> = result["trace"]
            .as_array()
            .unwrap()
            .iter()
            .map(|step| step.get("taken").cloned().unwrap_or(JsonValue::Null))
            .collect();
        assert_eq!(
            taken,
            vec![json!(false), json!(false), json!(true), JsonValue::Null]
        );
    }

    #[test]
    fn leaves_the_trace_out_unless_asked() {
        let result: JsonValue = serde_json::from_str(&run_pseudocode(
            &json!({"ast_json": program(vec![]), "stdin_lines": [], "virtual_files": {}})
                .to_string(),
        ))
        .unwrap();
        assert!(result.get("trace").is_none());
    }

    #[test]
    fn stops_infinite_loops_with_budget() {
        let ast = program(vec![
            json!({"kind":"while","condition":{"kind":"literal","value":true,"literalType":"BOOLEAN","span":span()},"body":[],"span":span()}),
        ]);
        let result = run_ast_json(&ast, Vec::new(), HashMap::new(), Some(10));
        assert!(!result.success);
        assert_eq!(result.diagnostics[0].code, "RUN408");
    }

    #[test]
    fn stops_empty_for_bodies_with_budget() {
        // A huge bound with an empty body never runs a statement, so only the
        // per-iteration budget step can stop it.
        let ast = program(vec![
            json!({"kind":"for","iterator":ident("Index"),"startValue":int(1),"endValue":int(i64::MAX),"stepValue":JsonValue::Null,"body":[],"span":span()}),
        ]);
        let result = run_ast_json(&ast, Vec::new(), HashMap::new(), Some(10));
        assert!(!result.success);
        assert_eq!(result.diagnostics[0].code, "RUN408");
    }
}
