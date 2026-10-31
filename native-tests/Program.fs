open Vigia.Domain
let buckets = Array.init 5 (fun i -> { minute = i; requests = 1000; errors = if i >= 3 then 200 else 0 })
let result = analyze 999000 5 5 2 14.4 buckets
if result.decision <> "alert" || result.longWindow.errors <> 400 || result.longWindow.allowedErrors <> 5 then failwith "Incident test failed"
let missing = analyze 999000 5 5 2 14.4 buckets[0..3]
if missing.decision <> "insufficient_data" then failwith "Coverage test failed"
let healthy = analyze 999000 5 5 2 14.4 (buckets |> Array.map (fun b -> {b with errors = 0}))
if healthy.decision <> "ok" || healthy.longWindow.remainingErrors <> 5 then failwith "Healthy test failed"
printfn "F# native domain checks passed."
