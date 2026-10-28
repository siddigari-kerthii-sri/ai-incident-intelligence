
import os
import json
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
model_name = os.getenv("GROQ_MODEL")

client = Groq(api_key=api_key) if api_key else None


def analyze_incident(
    title,
    description,
    similar_incidents=None,
    reviewer_feedback=None,
    previous_analysis=None,
):
    if client is None:
        print("AI incident analysis failed: GROQ_API_KEY is missing.")
        return None

    if not model_name:
        print("AI incident analysis failed: GROQ_MODEL is missing.")
        return None

    similar_incidents = similar_incidents or []

    # Prepare structured historical evidence for the LLM.
    historical_records = []

    for item in similar_incidents:
        incident = item.get("incident")
        if incident is None:
            continue

        historical_records.append({
            "incident_id": getattr(incident, "id", None),
            "similarity": item.get("similarity"),
            "title": getattr(incident, "title", None),
            "description": getattr(incident, "description", None),
            "service": getattr(incident, "service", None),
            "severity": getattr(incident, "severity", None),
            "category": getattr(incident, "category", None),
            "summary": getattr(incident, "summary", None),
            "possible_root_cause": getattr(
                incident, "possible_root_cause", None
            ),
            "recommended_action": getattr(
                incident, "recommended_action", None
            ),
        })

    historical_context = (
        json.dumps(historical_records, indent=2, default=str)
        if historical_records
        else "No similar historical incidents were found."
    )

    rework_context = ""

    if reviewer_feedback:
        rework_context = f"""
REANALYSIS REQUEST

A human engineer reviewed the previous AI analysis and requested
further investigation.

Previous AI analysis:
{json.dumps(previous_analysis or {}, indent=2, default=str)}

Reviewer feedback:
{reviewer_feedback}

Address the reviewer's feedback directly.

Reconsider the previous hypothesis. Use historical evidence where
relevant, but do not force a connection if the evidence does not support it.

Explain which diagnostic checks would help distinguish between
the remaining possible causes.
"""

    prompt = f"""
You are an AI incident triage assistant for a software engineering team.

Your task is to analyze the current incident using its description and
relevant historical incidents.

CURRENT INCIDENT
Title: {title}
Description: {description}

HISTORICAL SIMILAR INCIDENTS
{historical_context}

{rework_context}

HISTORICAL EVIDENCE ANALYSIS

Examine the historical incidents before generating your analysis.

1. Identify relevant similarities between the current incident and
   historical incidents, such as symptoms, affected service, error
   patterns, timing, or reported circumstances.

2. Review historical root-cause hypotheses and recommended actions.
   Distinguish between a proposed cause and a cause supported by a
   documented resolution or investigation finding.

3. Use relevant historical findings to make the current root-cause
   hypothesis and recommended actions more specific.

4. When useful, reference the historical incident ID in the summary,
   root-cause hypothesis, or recommendation so an engineer can trace
   the reasoning.

5. Prefer actionable diagnostic steps over generic advice. For example,
   if relevant historical evidence mentions database connection timeouts,
   recommend checking connection-pool metrics and timeout logs rather
   than simply saying "check the logs."

6. Do not assume a historical incident had the same root cause merely
   because its symptoms were similar.

7. If historical information is incomplete, contradictory, or irrelevant,
   state the uncertainty and provide appropriate diagnostic checks.

8. Never invent historical findings, successful resolutions, logs,
   metrics, deployments, or investigation results.

9. Historical incidents are contextual evidence, not proof of the
   current incident's root cause.

10. If no useful historical evidence exists, perform a normal incident
    analysis using the current incident details.

11. Set confidence according to the strength of the available evidence.
    Similarity alone is not proof of a shared cause.

Return ONLY a valid JSON object with exactly these fields:
{{
  "category": "...",
  "service": "...",
  "severity": "...",
  "summary": "...",
  "possible_root_cause": "...",
  "recommended_action": "...",
  "confidence": 0
}}

FIELD GUIDANCE

- category: The most appropriate incident category.
- service: The affected service identified from the supplied information.
- severity: Critical, High, Medium, or Low.
- summary: A concise summary of the incident and relevant historical
  context, when useful.
- possible_root_cause: A hypothesis, including relevant historical
  evidence and what remains unverified.
- recommended_action: Practical, prioritized diagnostic steps.
  Incorporate relevant historical recommendations when appropriate.
  Reference historical incident IDs when useful.
- confidence: A number from 0 to 100 reflecting evidential support,
  not certainty that the incident has been solved.

IMPORTANT RULES

- Do not claim that a root cause is confirmed unless the supplied
  evidence supports that conclusion.
- Do not claim to have inspected external systems or logs.
- Do not blindly copy historical root causes or recommendations.
- Do not treat similarity scores as probabilities of a shared root cause.
- During reanalysis, directly address the reviewer's feedback.
- Keep all seven required fields present and valid.
"""

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You analyze software incidents carefully. "
                        "Use relevant historical evidence to improve "
                        "diagnostic reasoning. Distinguish documented "
                        "findings from hypotheses. Never invent evidence."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Groq returned an empty response.")

        result = json.loads(content)

        required_fields = {
            "category",
            "service",
            "severity",
            "summary",
            "possible_root_cause",
            "recommended_action",
            "confidence",
        }

        if not isinstance(result, dict):
            raise ValueError("Groq response must be a JSON object.")

        if not required_fields.issubset(result):
            raise ValueError("Groq response is missing required fields.")

        for field in required_fields - {"confidence"}:
            if (
                not isinstance(result[field], str)
                or not result[field].strip()
            ):
                raise ValueError(
                    f"Groq returned an invalid value for {field}."
                )

        if result["severity"] not in {
            "Critical", "High", "Medium", "Low"
        }:
            raise ValueError("Groq returned an invalid severity.")

        confidence = result["confidence"]

        if (
            isinstance(confidence, bool)
            or not isinstance(confidence, (int, float))
            or not 0 <= confidence <= 100
        ):
            raise ValueError("Groq returned invalid confidence.")

        result["confidence"] = float(confidence)

        return result

    except Exception as exc:
        print(
            f"AI incident analysis failed: "
            f"{type(exc).__name__}: {exc}"
        )
        return None


def critique_incident(
    title,
    description,
    analysis,
    similar_incidents=None,
):
    """
    Independently review an AI-generated incident analysis.
    Returns a verdict and reasoning, or None if review fails.
    """

    if client is None or not model_name:
        print("AI critic failed: Groq configuration is missing.")
        return None

    if not isinstance(analysis, dict):
        print("AI critic failed: Invalid analysis input.")
        return None

    similar_incidents = similar_incidents or []
    historical_records = []

    for item in similar_incidents:
        incident = item.get("incident")
        if incident is None:
            continue

        historical_records.append({
            "incident_id": getattr(incident, "id", None),
            "title": getattr(incident, "title", None),
            "description": getattr(incident, "description", None),
            "possible_root_cause": getattr(
                incident, "possible_root_cause", None
            ),
            "summary": getattr(incident, "summary", None),
        })

    prompt = f"""
You are an independent AI critic reviewing a proposed
software incident analysis.

Your job is to evaluate the quality of the reasoning,
not to agree automatically with the original AI.

CURRENT INCIDENT
Title: {title}
Description: {description}

PROPOSED AI ANALYSIS
{json.dumps(analysis, indent=2, default=str)}

RELEVANT HISTORICAL INCIDENTS
{json.dumps(historical_records, indent=2, default=str)
 if historical_records
 else "No similar historical incidents were supplied."}

REVIEW CRITERIA

1. Check whether the proposed root cause is consistent
   with the supplied incident description and evidence.

2. Identify contradictions, unsupported claims, or
   conclusions that go beyond the available information.

3. Check whether the recommended actions reasonably
   follow from the proposed diagnosis.

4. Treat historical incidents as context, not proof that
   the current incident has the same root cause.

5. Do not assume that logs, metrics, configurations,
   deployments, or external systems were inspected unless
   that information was actually supplied.

6. A plausible hypothesis is not necessarily a confirmed
   root cause. Lack of confirmation alone does not mean
   the analysis must fail.

7. Use NEEDS_MORE_EVIDENCE when the analysis is plausible
   but the available information is insufficient to assess
   important claims confidently.

VERDICT DEFINITIONS

PASS:
The analysis is reasonable and consistent with the
available information. No major reasoning flaw is apparent.

NEEDS_MORE_EVIDENCE:
The hypothesis may be reasonable, but important claims
cannot be adequately assessed from the supplied information.

FAIL:
The analysis contains a significant contradiction,
unsupported factual claim, or major reasoning flaw.

Return ONLY a valid JSON object with exactly these fields:
{{
  "verdict": "PASS",
  "reasoning": "Explain the assessment."
}}

The verdict must be exactly one of:
PASS, NEEDS_MORE_EVIDENCE, FAIL.

Keep the reasoning specific to this incident. Do not
claim certainty beyond the available evidence.
"""

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a skeptical but fair technical reviewer. "
                        "Assess the supplied analysis independently. "
                        "Never invent evidence or treat hypotheses as facts."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Groq returned an empty critic response.")

        result = json.loads(content)

        if not isinstance(result, dict):
            raise ValueError("Critic response must be a JSON object.")

        if set(result.keys()) != {"verdict", "reasoning"}:
            raise ValueError("Critic response has unexpected fields.")

        if result["verdict"] not in {
            "PASS",
            "NEEDS_MORE_EVIDENCE",
            "FAIL",
        }:
            raise ValueError("Critic returned an invalid verdict.")

        if (
            not isinstance(result["reasoning"], str)
            or not result["reasoning"].strip()
        ):
            raise ValueError("Critic returned invalid reasoning.")

        return result

    except Exception as exc:
        print(
            f"AI critic failed: {type(exc).__name__}: {exc}"
        )
        return None
