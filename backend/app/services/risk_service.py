from typing import List, Dict, Any

SEVERITY_POINTS = {
    "info": 0,
    "low": 1,
    "medium": 3,
    "high": 7,
    "critical": 15
}

def calculate_risk_band(violations: List[Dict[str, Any]], claims: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Deterministic risk band scoring per PRD Section 10.6 & 16.1.
    Pure function: identical inputs always yield identical band and points.
    """
    claims = claims or []
    points = 0
    breakdown = []
    category_counts = {}

    has_critical_contradiction = False
    has_high_approved = False
    has_unresolved_claim = False

    for v in violations:
        sev = v.get("severity", "medium").lower()
        pts = SEVERITY_POINTS.get(sev, 3)
        cat = v.get("category", "other")

        points += pts
        category_counts[cat] = category_counts.get(cat, 0) + 1

        breakdown.append({
            "issue_code": v.get("issue_code", "ISSUE"),
            "category": cat,
            "severity": sev,
            "points": pts,
            "explanation": v.get("explanation", ""),
            "guideline_ref": v.get("guideline_ref", "General")
        })

    for c in claims:
        st = c.get("status", "").lower()
        if st in ("contradicted", "outdated"):
            has_critical_contradiction = True
        elif st in ("unsupported", "needs_review"):
            has_unresolved_claim = True

    # Check for High violations backed by approved sources
    for v in violations:
        if v.get("severity") in ("high", "critical") and v.get("guideline_ref"):
            has_high_approved = True

    # Band rules evaluation (Top-down match)
    if points >= 25 or has_critical_contradiction:
        band = "CRITICAL"
        reason = f"Total points ({points}) exceed threshold (25) or contains contradicted/outdated claims."
    elif points >= 12 or has_high_approved:
        band = "HIGH"
        reason = f"Total points ({points}) in high range (12-24) or contains high-severity brand guideline violation."
    elif points >= 4 or has_unresolved_claim:
        band = "MEDIUM"
        reason = f"Total points ({points}) in medium range (4-11) or contains unresolved/unsupported claims."
    else:
        band = "LOW"
        reason = f"Total points ({points}) within safe range (0-3) with zero high-risk violations."

    return {
        "risk_band": band,
        "points": points,
        "reason": reason,
        "breakdown": breakdown,
        "category_counts": category_counts
    }
