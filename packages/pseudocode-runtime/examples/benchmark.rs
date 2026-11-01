//! End-to-end runtime benchmarks, including request parsing and result serialization.
//! Run with `cargo run -p pseudocode-runtime --release --example benchmark`.
use pseudocode_runtime::run_pseudocode;
use serde_json::{json, Value};
use std::hint::black_box;
use std::time::Instant;

fn ident(name: &str) -> Value {
    json!({"kind":"identifier","name":name})
}

fn int(value: i64) -> Value {
    json!({"kind":"literal","literalType":"INTEGER","value":value})
}

fn text(value: &str) -> Value {
    json!({"kind":"literal","literalType":"STRING","value":value})
}

fn for_loop(end: i64, body: Vec<Value>) -> Value {
    json!({"kind":"for","iterator":ident("Index"),"startValue":int(1),"endValue":int(end),"body":body})
}

fn output(value: Value) -> Value {
    json!({"kind":"output","values":[value]})
}

fn request(body: Vec<Value>, files: Value, trace: bool) -> String {
    json!({
        "ast_json": json!({"kind":"program","body":body}).to_string(),
        "stdin_lines": [], "virtual_files": files, "trace": trace
    })
    .to_string()
}

fn measure(name: &str, request: String, expected: &str) {
    if std::env::args().any(|arg| arg == "--requests") {
        println!(
            "{}",
            json!({"name": name, "request": request, "expected": expected})
        );
        return;
    }
    let mut samples = Vec::new();
    for _ in 0..8 {
        let start = Instant::now();
        let result = black_box(run_pseudocode(black_box(&request)));
        let elapsed = start.elapsed().as_secs_f64() * 1_000.0;
        let result: Value = serde_json::from_str(&result).expect("valid result");
        assert_eq!(result["success"], true, "{}", result["stderr"]);
        assert_eq!(result["stdout"], expected);
        samples.push(elapsed);
    }
    // Exclude the warmup, and report the median of seven runs.
    samples.remove(0);
    samples.sort_by(f64::total_cmp);
    println!("{name}: {:.3} ms (median of 7)", samples[3]);
}

fn main() {
    let array_access = json!({"kind":"arrayAccess","name":"Data","indices":[ident("Index")]});
    let array_program = vec![
        json!({"kind":"declare","identifier":ident("Data"),"typeNode":{"kind":"array","elementType":"INTEGER","dimensions":[{"lower":1,"upper":2000}]}}),
        for_loop(
            2000,
            vec![json!({"kind":"assignment","target":array_access,"value":ident("Index")})],
        ),
        json!({"kind":"declare","identifier":ident("Total"),"typeNode":{"kind":"basic","name":"INTEGER"}}),
        for_loop(
            2000,
            vec![
                json!({"kind":"assignment","target":ident("Total"),"value":{"kind":"binary","operator":"+","left":ident("Total"),"right":array_access}}),
            ],
        ),
        output(ident("Total")),
    ];
    measure(
        "array sum (2000 elements)",
        request(array_program.clone(), json!({}), false),
        "2001000",
    );
    measure(
        "traced array sum (2000 elements)",
        request(array_program, json!({}), true),
        "2001000",
    );

    let file_program = vec![
        json!({"kind":"openfile","fileIdentifier":text("data.txt"),"mode":"READ"}),
        for_loop(
            2000,
            vec![
                json!({"kind":"readfile","fileIdentifier":text("data.txt"),"target":ident("Line")}),
            ],
        ),
        output(ident("Line")),
    ];
    let lines = (1..=2000)
        .map(|n| format!("Record {n}: example data"))
        .collect::<Vec<_>>();
    measure(
        "file scan (2000 lines)",
        request(file_program, json!({"data.txt":lines}), false),
        "Record 2000: example data",
    );

    let arithmetic = vec![
        json!({"kind":"declare","identifier":ident("Total"),"typeNode":{"kind":"basic","name":"INTEGER"}}),
        for_loop(
            50000,
            vec![
                json!({"kind":"assignment","target":ident("Total"),"value":{"kind":"binary","operator":"+","left":ident("Total"),"right":ident("Index")}}),
            ],
        ),
        output(ident("Total")),
    ];
    measure(
        "arithmetic sum (50000 iterations)",
        request(arithmetic.clone(), json!({}), false),
        "1250025000",
    );
    measure(
        "traced arithmetic sum (50000 iterations)",
        request(arithmetic, json!({}), true),
        "1250025000",
    );

    let mut routines = (0..500)
        .map(|index| json!({"kind":"declare","identifier":ident(&format!("Global{index}")),"typeNode":{"kind":"basic","name":"INTEGER"}}))
        .collect::<Vec<_>>();
    routines.push(json!({"kind":"functionDefinition","name":"Increment","params":[{"name":"Value","typeNode":{"kind":"basic","name":"INTEGER"}}],"body":[{"kind":"return","value":{"kind":"binary","operator":"+","left":ident("Value"),"right":int(1)}}]}));
    routines.push(json!({"kind":"declare","identifier":ident("Total"),"typeNode":{"kind":"basic","name":"INTEGER"}}));
    routines.push(for_loop(5000, vec![json!({"kind":"assignment","target":ident("Total"),"value":{"kind":"binary","operator":"+","left":ident("Total"),"right":{"kind":"call","name":"Increment","args":[ident("Index")]}}})]));
    routines.push(output(ident("Total")));
    measure(
        "5000 function calls with 500 globals",
        request(routines, json!({}), false),
        "12507500",
    );
}
