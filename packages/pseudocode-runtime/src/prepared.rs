//! Decode hot AST nodes once. Runtime values and control flow retain the interpreter's semantics.
use super::*;

pub(super) type Symbol = usize;

pub(super) fn symbol(symbols: &mut HashMap<String, Symbol>, name: &str) -> Symbol {
    let next = symbols.len();
    *symbols.entry(name.to_lowercase()).or_insert(next)
}

#[derive(Clone, Copy)]
pub(super) struct Location {
    pub line: usize,
    column: usize,
}

impl Location {
    fn of(node: &JsonValue) -> Self {
        Self {
            line: span_line(node, "startLine"),
            column: node
                .get("span")
                .and_then(|s| s.get("startColumn"))
                .and_then(JsonValue::as_u64)
                .unwrap_or(1) as usize,
        }
    }

    pub fn error(self, message: impl Into<String>) -> RuntimeError {
        RuntimeError::new(message, self.line, self.column)
    }
}

pub(super) struct Expression {
    pub location: Location,
    pub kind: ExpressionKind,
}

pub(super) enum ExpressionKind {
    Literal(Value),
    Identifier(Symbol, String),
    Unary(bool, Box<Expression>),
    Binary(BinaryOp, Box<Expression>, Box<Expression>),
    Missing(RuntimeError),
    Fallback(JsonValue),
}

#[derive(Clone, Copy)]
pub(super) enum BinaryOp {
    Add,
    Subtract,
    Multiply,
    Divide,
    IntDivide,
    Modulo,
    Power,
    Equal,
    NotEqual,
    Less,
    LessEqual,
    Greater,
    GreaterEqual,
    And,
    Or,
    Unknown,
}

impl Expression {
    fn field(node: &JsonValue, field: &str, symbols: &mut HashMap<String, Symbol>) -> Self {
        match required(node, field) {
            Ok(value) => Self::new(value, symbols),
            Err(error) => Self {
                location: Location::of(node),
                kind: ExpressionKind::Missing(error),
            },
        }
    }

    pub fn new(node: &JsonValue, symbols: &mut HashMap<String, Symbol>) -> Self {
        let kind = match str_field(node, "kind") {
            "literal" => ExpressionKind::Literal(match str_field(node, "literalType") {
                "INTEGER" => {
                    Value::Integer(node.get("value").and_then(JsonValue::as_i64).unwrap_or(0))
                }
                "REAL" => Value::Real(node.get("value").and_then(JsonValue::as_f64).unwrap_or(0.0)),
                "BOOLEAN" => Value::Boolean(
                    node.get("value")
                        .and_then(JsonValue::as_bool)
                        .unwrap_or(false),
                ),
                _ => Value::String(str_field(node, "value").to_string()),
            }),
            "identifier" => {
                let name = str_field(node, "name");
                ExpressionKind::Identifier(symbol(symbols, name), name.to_string())
            }
            "unary" => ExpressionKind::Unary(
                str_field(node, "operator") == "NOT",
                Box::new(Self::field(node, "operand", symbols)),
            ),
            "binary" => {
                let op = match str_field(node, "operator") {
                    "+" => BinaryOp::Add,
                    "-" => BinaryOp::Subtract,
                    "*" => BinaryOp::Multiply,
                    "/" => BinaryOp::Divide,
                    "DIV" => BinaryOp::IntDivide,
                    "MOD" => BinaryOp::Modulo,
                    "^" => BinaryOp::Power,
                    "=" => BinaryOp::Equal,
                    "<>" => BinaryOp::NotEqual,
                    "<" => BinaryOp::Less,
                    "<=" => BinaryOp::LessEqual,
                    ">" => BinaryOp::Greater,
                    ">=" => BinaryOp::GreaterEqual,
                    "AND" => BinaryOp::And,
                    "OR" => BinaryOp::Or,
                    _ => BinaryOp::Unknown,
                };
                ExpressionKind::Binary(
                    op,
                    Box::new(Self::field(node, "left", symbols)),
                    Box::new(Self::field(node, "right", symbols)),
                )
            }
            _ => ExpressionKind::Fallback(node.clone()),
        };
        Self {
            location: Location::of(node),
            kind,
        }
    }
}

pub(super) struct Statement {
    pub location: Location,
    pub kind: StatementKind,
}

pub(super) enum StatementKind {
    Assign(Symbol, Expression),
    Output(Vec<Expression>),
    Return(Expression),
    If(Expression, Vec<Statement>, Vec<Statement>),
    For {
        iterator: Symbol,
        redeclares_iterator: bool,
        start: Expression,
        end: Expression,
        step: Option<Expression>,
        body: Vec<Statement>,
    },
    While(Expression, Vec<Statement>),
    Repeat(Vec<Statement>, Expression),
    Fallback(JsonValue),
}

impl Statement {
    fn redeclares(node: &JsonValue, name: &str) -> bool {
        if matches!(str_field(node, "kind"), "declare" | "constant")
            && nested_str(node, &["identifier", "name"]).to_lowercase() == name
        {
            return true;
        }
        match node {
            JsonValue::Array(nodes) => nodes.iter().any(|node| Self::redeclares(node, name)),
            JsonValue::Object(fields) => fields.values().any(|node| Self::redeclares(node, name)),
            _ => false,
        }
    }

    fn block(node: &JsonValue, field: &str, symbols: &mut HashMap<String, Symbol>) -> Vec<Self> {
        array_field(node, field)
            .iter()
            .map(|node| Self::new(node, symbols))
            .collect()
    }

    pub fn new(node: &JsonValue, symbols: &mut HashMap<String, Symbol>) -> Self {
        let kind = match str_field(node, "kind") {
            "assignment"
                if node
                    .get("target")
                    .is_some_and(|target| str_field(target, "kind") == "identifier") =>
            {
                let name = nested_str(node, &["target", "name"]);
                StatementKind::Assign(
                    symbol(symbols, name),
                    Expression::field(node, "value", symbols),
                )
            }
            "output" => StatementKind::Output(
                array_field(node, "values")
                    .iter()
                    .map(|node| Expression::new(node, symbols))
                    .collect(),
            ),
            "return" => StatementKind::Return(Expression::field(node, "value", symbols)),
            "if" => StatementKind::If(
                Expression::field(node, "condition", symbols),
                Self::block(node, "thenBody", symbols),
                Self::block(node, "elseBody", symbols),
            ),
            "for" => StatementKind::For {
                iterator: symbol(symbols, nested_str(node, &["iterator", "name"])),
                redeclares_iterator: array_field(node, "body").iter().any(|statement| {
                    Self::redeclares(
                        statement,
                        &nested_str(node, &["iterator", "name"]).to_lowercase(),
                    )
                }),
                start: Expression::field(node, "startValue", symbols),
                end: Expression::field(node, "endValue", symbols),
                step: node
                    .get("stepValue")
                    .filter(|value| !value.is_null())
                    .map(|value| Expression::new(value, symbols)),
                body: Self::block(node, "body", symbols),
            },
            "while" => StatementKind::While(
                Expression::field(node, "condition", symbols),
                Self::block(node, "body", symbols),
            ),
            "repeat" if node.get("condition").is_some() => StatementKind::Repeat(
                Self::block(node, "body", symbols),
                Expression::field(node, "condition", symbols),
            ),
            _ => StatementKind::Fallback(node.clone()),
        };
        Self {
            location: Location::of(node),
            kind,
        }
    }
}

impl Runtime {
    #[inline]
    pub(super) fn eval_prepared(&mut self, expression: &Expression) -> RuntimeResult<Value> {
        if let ExpressionKind::Missing(error) = &expression.kind {
            return Err(error.clone());
        }
        self.step_at(expression.location)?;
        match &expression.kind {
            ExpressionKind::Literal(value) => Ok(value.clone()),
            ExpressionKind::Identifier(id, name) => {
                self.lookup_slot(*id).cloned().ok_or_else(|| {
                    expression
                        .location
                        .error(format!("Undeclared identifier \"{name}\"."))
                })
            }
            ExpressionKind::Unary(not, operand) => {
                let value = self.eval_prepared(operand)?;
                Ok(if *not {
                    Value::Boolean(!value.truthy())
                } else {
                    match value {
                        Value::Real(n) => Value::Real(-n),
                        other => Value::Integer(-other.to_i64()),
                    }
                })
            }
            ExpressionKind::Binary(op, left, right) => {
                self.eval_binary_prepared(*op, left, right, expression.location)
            }
            ExpressionKind::Fallback(node) => self.eval_generic(node),
            ExpressionKind::Missing(_) => unreachable!(),
        }
    }

    fn eval_binary_prepared(
        &mut self,
        op: BinaryOp,
        left: &Expression,
        right: &Expression,
        location: Location,
    ) -> RuntimeResult<Value> {
        let left = self.eval_prepared(left)?;
        if matches!(op, BinaryOp::And) {
            return Ok(Value::Boolean(
                left.truthy() && self.eval_prepared(right)?.truthy(),
            ));
        }
        if matches!(op, BinaryOp::Or) {
            return Ok(Value::Boolean(
                left.truthy() || self.eval_prepared(right)?.truthy(),
            ));
        }
        let right = self.eval_prepared(right)?;
        Ok(match op {
            BinaryOp::Add if is_text(&left) || is_text(&right) => {
                Value::String(format!("{}{}", left.display(), right.display()))
            }
            BinaryOp::Add => numeric_result(&left, &right, left.to_f64() + right.to_f64(), false),
            BinaryOp::Subtract => {
                numeric_result(&left, &right, left.to_f64() - right.to_f64(), false)
            }
            BinaryOp::Multiply => {
                numeric_result(&left, &right, left.to_f64() * right.to_f64(), false)
            }
            BinaryOp::Divide => {
                if right.to_f64() == 0.0 {
                    return Err(location.error("Division by zero"));
                }
                Value::Real(left.to_f64() / right.to_f64())
            }
            BinaryOp::IntDivide | BinaryOp::Modulo => {
                let divisor = right.to_i64();
                if divisor == 0 {
                    return Err(location.error(if matches!(op, BinaryOp::IntDivide) {
                        "Division by zero"
                    } else {
                        "Modulo by zero"
                    }));
                }
                Value::Integer(if matches!(op, BinaryOp::IntDivide) {
                    left.to_i64().div_euclid(divisor)
                } else {
                    left.to_i64().rem_euclid(divisor)
                })
            }
            BinaryOp::Power => {
                numeric_result(&left, &right, left.to_f64().powf(right.to_f64()), true)
            }
            BinaryOp::Equal => Value::Boolean(values_equal(&left, &right)),
            BinaryOp::NotEqual => Value::Boolean(!values_equal(&left, &right)),
            BinaryOp::Less => Value::Boolean(compare_values(&left, &right, |a, b| a < b)),
            BinaryOp::LessEqual => Value::Boolean(compare_values(&left, &right, |a, b| a <= b)),
            BinaryOp::Greater => Value::Boolean(compare_values(&left, &right, |a, b| a > b)),
            BinaryOp::GreaterEqual => Value::Boolean(compare_values(&left, &right, |a, b| a >= b)),
            _ => Value::Null,
        })
    }

    #[inline]
    fn exec_prepared_block(&mut self, body: &[Statement]) -> RuntimeResult<Flow> {
        for statement in body {
            match self.exec_prepared(statement)? {
                Flow::Continue => {}
                flow => return Ok(flow),
            }
        }
        Ok(Flow::Continue)
    }

    #[inline]
    pub(super) fn exec_prepared(&mut self, statement: &Statement) -> RuntimeResult<Flow> {
        if let StatementKind::Fallback(node) = &statement.kind {
            return self.exec_statement_generic(node);
        }
        self.step_at(statement.location)?;
        let line = statement.location.line;
        let test = match &statement.kind {
            StatementKind::If(..) => self.record(line, true),
            StatementKind::For { .. } | StatementKind::While(..) | StatementKind::Repeat(..) => {
                None
            }
            _ => self.record(line, false),
        };
        match &statement.kind {
            StatementKind::Assign(id, expression) => {
                let value = self.eval_prepared(expression)?;
                self.assign_slot(*id, value);
            }
            StatementKind::Output(expressions) => {
                let mut line = String::new();
                for expression in expressions {
                    line.push_str(&self.eval_prepared(expression)?.display());
                }
                self.output_lines += line.matches('\n').count() + 1;
                self.stdout.push(line);
            }
            StatementKind::Return(expression) => {
                return Ok(Flow::Return(self.eval_prepared(expression)?))
            }
            StatementKind::If(condition, yes, no) => {
                let taken = self.eval_prepared(condition)?.truthy();
                self.set_taken(test, taken);
                return self.exec_prepared_block(if taken { yes } else { no });
            }
            StatementKind::For {
                iterator,
                redeclares_iterator,
                start,
                end,
                step,
                body,
            } => {
                self.record(line, true);
                let end = self.eval_prepared(end)?.to_i64();
                let step = if let Some(step) = step {
                    self.eval_prepared(step)?.to_i64()
                } else {
                    1
                };
                if step == 0 {
                    return Err(statement.location.error("FOR STEP cannot be zero"));
                }
                let mut value = self.eval_prepared(start)?.to_i64();
                let integer_type: Rc<str> = Rc::from("INTEGER");
                let mut first = true;
                let mut type_declared = false;
                loop {
                    if !first {
                        self.record(line, true);
                    }
                    first = false;
                    if (step > 0 && value > end) || (step < 0 && value < end) {
                        break;
                    }
                    // An empty body never reaches a statement or expression, so the loop
                    // itself must spend one budget step per iteration or it can spin forever.
                    self.step_at(statement.location)?;
                    self.assign_slot(*iterator, Value::Integer(value));
                    // A declaration in the body can replace the iterator's type. Otherwise
                    // the INTEGER type remains unchanged across all loop iterations.
                    if !type_declared || *redeclares_iterator {
                        self.declare_type_slot(*iterator, &integer_type);
                        type_declared = true;
                    }
                    if let flow @ Flow::Return(_) = self.exec_prepared_block(body)? {
                        return Ok(flow);
                    }
                    value += step;
                }
            }
            StatementKind::While(condition, body) => {
                while {
                    self.record(line, true);
                    self.eval_prepared(condition)?.truthy()
                } {
                    if let flow @ Flow::Return(_) = self.exec_prepared_block(body)? {
                        return Ok(flow);
                    }
                }
            }
            StatementKind::Repeat(body, condition) => loop {
                if let flow @ Flow::Return(_) = self.exec_prepared_block(body)? {
                    return Ok(flow);
                }
                self.record(condition.location.line, true);
                if self.eval_prepared(condition)?.truthy() {
                    break;
                }
            },
            StatementKind::Fallback(_) => unreachable!(),
        }
        Ok(Flow::Continue)
    }
}
