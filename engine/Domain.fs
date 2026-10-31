module Vigia.Domain

type Bucket = { minute: int; requests: int; errors: int }
type Window = {
    minutes: int; present: int; coverage: float; complete: bool; requests: int; errors: int
    allowedErrors: int; remainingErrors: int; availability: float; burnRate: float; hasTraffic: bool; withinTarget: bool
}
type Analysis = { targetPpm: int; threshold: float; decision: string; longWindow: Window; shortWindow: Window }

let analyze (targetPpm: int) (endMinute: int) (longMinutes: int) (shortMinutes: int) (threshold: float) (buckets: Bucket array) : Analysis =
    let budgetPpm = 1000000 - targetPpm
    let window minutes =
        let selected = buckets |> Array.filter (fun b -> b.minute >= endMinute - minutes && b.minute < endMinute)
        let requests = selected |> Array.sumBy (fun b -> b.requests)
        let errors = selected |> Array.sumBy (fun b -> b.errors)
        let allowed = int (floor (float requests * float budgetPpm / 1000000.0))
        { minutes = minutes; present = selected.Length; coverage = float selected.Length / float minutes
          complete = selected.Length = minutes; requests = requests; errors = errors
          allowedErrors = allowed; remainingErrors = allowed - errors; hasTraffic = requests > 0
          withinTarget = requests > 0 && float errors * 1000000.0 <= float requests * float budgetPpm
          availability = if requests > 0 then 1.0 - float errors / float requests else nan
          burnRate = if requests > 0 then float errors * 1000000.0 / (float requests * float budgetPpm) else nan }
    let longWindow = window longMinutes
    let shortWindow = window shortMinutes
    let enough = longWindow.complete && shortWindow.complete && longWindow.hasTraffic && shortWindow.hasTraffic
    let decision =
        if not enough then "insufficient_data"
        elif longWindow.burnRate >= threshold && shortWindow.burnRate >= threshold then "alert"
        else "ok"
    { targetPpm = targetPpm; threshold = threshold; decision = decision; longWindow = longWindow; shortWindow = shortWindow }
