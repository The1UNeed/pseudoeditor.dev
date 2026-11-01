//! Test-only interpreter retained as a reference for prepared execution.
use super::*;

impl Runtime {
    pub(super) fn eval_reference(&mut self, expression: &JsonValue) -> RuntimeResult<Value> {
        self.step(expression)?;
        match str_field(expression, "kind") {
            "literal" => Ok(match str_field(expression, "literalType") {
                "INTEGER" => Value::Integer(
                    expression
                        .get("value")
                        .and_then(JsonValue::as_i64)
                        .unwrap_or(0),
                ),
                "REAL" => Value::Real(
                    expression
                        .get("value")
                        .and_then(JsonValue::as_f64)
                        .unwrap_or(0.0),
                ),
                "BOOLEAN" => Value::Boolean(
                    expression
                        .get("value")
                        .and_then(JsonValue::as_bool)
                        .unwrap_or(false),
                ),
                _ => Value::String(
                    expression
                        .get("value")
                        .and_then(JsonValue::as_str)
                        .unwrap_or("")
                        .to_string(),
                ),
            }),
            "identifier" => self
                .lookup_ref(str_field(expression, "name"))
                .cloned()
                .ok_or_else(|| {
                    RuntimeError::at(
                        expression,
                        format!(
                            "Undeclared identifier \"{}\".",
                            str_field(expression, "name")
                        ),
                    )
                }),
            "arrayAccess" => self.read_array(expression),
            "unary" => {
                let operand = self.eval(required(expression, "operand")?)?;
                if str_field(expression, "operator") == "NOT" {
                    Ok(Value::Boolean(!operand.truthy()))
                } else {
                    match operand {
                        Value::Real(value) => Ok(Value::Real(-value)),
                        value => Ok(Value::Integer(-value.to_i64())),
                    }
                }
            }
            "binary" => self.eval_binary_reference(expression),
            "call" => self.call_function(
                str_field(expression, "name"),
                array_field(expression, "args"),
                expression,
            ),
            _ => Ok(Value::Null),
        }
    }

    fn eval_binary_reference(&mut self, expression: &JsonValue) -> RuntimeResult<Value> {
        let left = self.eval(required(expression, "left")?)?;
        let op = str_field(expression, "operator");
        if op == "AND" {
            return Ok(Value::Boolean(
                left.truthy() && self.eval(required(expression, "right")?)?.truthy(),
            ));
        }
        if op == "OR" {
            return Ok(Value::Boolean(
                left.truthy() || self.eval(required(expression, "right")?)?.truthy(),
            ));
        }
        let right = self.eval(required(expression, "right")?)?;
        Ok(match op {
            "+" if is_text(&left) || is_text(&right) => {
                Value::String(format!("{}{}", left.display(), right.display()))
            }
            "+" => numeric_result(&left, &right, left.to_f64() + right.to_f64(), false),
            "-" => numeric_result(&left, &right, left.to_f64() - right.to_f64(), false),
            "*" => numeric_result(&left, &right, left.to_f64() * right.to_f64(), false),
            "/" => {
                if right.to_f64() == 0.0 {
                    return Err(RuntimeError::at(expression, "Division by zero"));
                }
                Value::Real(left.to_f64() / right.to_f64())
            }
            "DIV" => {
                let divisor = right.to_i64();
                if divisor == 0 {
                    return Err(RuntimeError::at(expression, "Division by zero"));
                }
                Value::Integer(left.to_i64().div_euclid(divisor))
            }
            "MOD" => {
                let divisor = right.to_i64();
                if divisor == 0 {
                    return Err(RuntimeError::at(expression, "Modulo by zero"));
                }
                Value::Integer(left.to_i64().rem_euclid(divisor))
            }
            "^" => numeric_result(&left, &right, left.to_f64().powf(right.to_f64()), true),
            "=" => Value::Boolean(values_equal(&left, &right)),
            "<>" => Value::Boolean(!values_equal(&left, &right)),
            "<" => Value::Boolean(compare_values(&left, &right, |a, b| a < b)),
            "<=" => Value::Boolean(compare_values(&left, &right, |a, b| a <= b)),
            ">" => Value::Boolean(compare_values(&left, &right, |a, b| a > b)),
            ">=" => Value::Boolean(compare_values(&left, &right, |a, b| a >= b)),
            _ => Value::Null,
        })
    }
}
