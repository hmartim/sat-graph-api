# Case Law Datasets - Interpretive Graph Overlay

This directory contains JSON datasets demonstrating the **Interpretive Graph Overlay** extension to the SAT-Graph framework. These datasets validate the paper's central thesis: that the same ontological primitives (`Item`, `Version`, `Action`, `TextUnit`) used for statutory law can model case law through **topological reconfiguration alone**, without requiring new classes.

## Overview

Each dataset represents a landmark Brazilian Supreme Court (STF) case, encoded as a graph demonstrating different interpretive phenomena:


| File                                      | Case               | Phenomenon              | Key Insight                                                                                              |
| ----------------------------------------- | ------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `hc-126292-presumption-of-innocence.json` | **HC 126.292**     | Interpretive Mutation   | Constitutional text unchanged, but binding interpretation reversed twice (2016→2019)                    |
| `adi-4983-vaquejada-dialogue.json`        | **ADI 4983**       | Constitutional Dialogue | Judiciary declares unconstitutional → Legislature creates exception via new provision (backlash effect) |
| `ipi-credit-divergence.json`              | **IPI Tax Credit** | Jurisprudential Split   | Two STF Panels reach conflicting conclusions; no Plenary unification exists                              |

## Case A: Interpretive Mutation (HC 126.292)

**Legal Question:** Can a defendant be imprisoned after second-instance conviction, before final judgment?

**Timeline:**

- **1988-10-05:** Original constitutional text (Art. 5, LVII) - "no one shall be considered guilty until final judgment"
- **2016-02-17:** STF rules (HC 126.292, 7-4) → **YES**, imprisonment allowed after 2nd instance
- **2019-11-07:** STF reverses (ADCs 43/44/54, 6-5) → **NO**, requires final judgment

**Graph Topology:**

```
                                  ┌──[Interpretation Event 2016]──> I-TV₁ (allows imprisonment)
S-TV₀ (1988) [Active] ───────────┤                                         │
                                  │                          [Overruling Event 2019]
                                  │                                         ↓
                                  └──────────────────────────────────> I-TV₂ (prohibits imprisonment)

S-TV remains active throughout, overlaid by successive interpretations (|V_valid| = 2: S-TV + whichever I-TV is current)
```

**Demonstrates:**

- Interpretive Versions (`I-TV`) **overlaying** Statutory Versions (`S-TV`) without textual amendment
- Sequential overruling of precedents (I-TV₂ replaces I-TV₁, but both overlay S-TV₀)
- Same constitutional text yielding opposite legal answers depending on query date
- S-TV remains active for general citation and RAG context

## Case B: Constitutional Dialogue (ADI 4983)

**Legal Question:** Is vaquejada (rodeo practice) constitutional under environmental protection clause?

**Timeline:**

- **1988-10-05:** Original constitutional text (Art. 225, §1, VII) - prohibition of animal cruelty
- **2016-10-06:** STF rules (ADI 4983, 6-5) → **Unconstitutional** (intrinsic animal cruelty)
- **2017-06-06:** Congress enacts **Constitutional Amendment 96** → Creates exception for cultural sports

**Graph Topology:**

```
Item: art225_par1_inc7                                Item: art225_par7
S-TV₀ (1988) [Active] ──[Interpretation 2016]──> I-TV₁ (vaquejada unconstitutional) [Overlays S-TV]

                                                      S-TV₀ (par7) [Created 2017]

After 2017, two separate Items coexist, each with independent version chains:
- **Item art225_par1_inc7**: 2 active versions
  - S-TV₀: general prohibition on animal cruelty (applies to all cases)
  - I-TV₁: vaquejada specifically violates this prohibition (overlays S-TV₀)
- **Item art225_par7**: 1 active version
  - S-TV₀: cultural animal sports exception (created 2017, coexists with inc VII)
```

**Demonstrates:**

- Legislative response to judicial interpretation through creation of new provision
- "Backlash effect" - rapid legislative response to unpopular judicial decision
- Interpretive Version (`I-TV`) of inc VII continues valid alongside new provision
- Constitutional dialogue via exception creation rather than direct override
- Two independent Items with separate version chains coexisting

## Case C: Jurisprudential Split (IPI Tax Credit)

**Legal Question:** Do taxpayers have right to IPI credit for taxed inputs used in non-taxed final products?

**Timeline:**

- **2018-05-15:** First Panel rules → **YES** (broad non-cumulativity interpretation)
- **2018-08-20:** Second Panel rules → **NO** (requires downstream tax obligation)
- **Status:** Divergence unresolved; no Plenary unification

**Graph Topology:**

```
                              ┌──[1st Panel 2018-05-15]──> I-TV₁ (allows credit)
S-TV₀ (1988) [Active] ───────┤
                              └──[2nd Panel 2018-08-20]──> I-TV₂ (denies credit)

              Three versions simultaneously active → |V_valid| = 3
              (Statutory text + two conflicting interpretive overlays)
```

**Demonstrates:**

- Statutory Version remains active while overlaid by interpretations
- Multiple concurrent Interpretive Versions (`|V_valid| = 3`)
- Chamber-specific metadata (`Action.metadata.chamber`) distinguishes conflicting interpretations
- Agent behavior: detects multiple concurrent I-TVs and triggers comparative analysis (application-level logic, not a graph primitive)
- Structured legal risk assessment: "No consensus; outcomes vary by panel"

## Data Structure

Each JSON file follows the SAT-Graph schema with these core sections:

### 1. **metadata**

High-level case description and demonstration purpose

### 2. **items**

Abstract identities (`F1 Work`):

- Constitutional provisions
- Judgments
- Judgment components (votes)
- Legislation

### 3. **versions**

Temporal states of items. All versions share the same `Version` schema with two possible `type` values:

- **`type: "statutory"`** (`S-TV`): Legislative text at a specific moment, or the canonical record of a judgment component (vote). Any `Version` whose parent `Item` has `typeId: "judgment-component"` is a statutory-type version representing the vote record.
- **`type: "interpretive"`** (`I-TV`): Judicial interpretation overlaying statutory text, created by an `Interpretation` or `Overruling` action without terminating the underlying S-TV.

Key Version properties used in these datasets:

- `producedByActionId`: Backward causality — the Action that created this version
- `terminatedByActionId`: Backward causality — the Action that ended this version's validity (`null` if still active)
- `usedAsSourceInActionIds`: Forward causality — Actions for which this version served as authorizing source (populated for legislative command versions)
- `applicabilityInterval`: *(optional)* The interval during which this version can produce legal effects, distinct from `validityInterval`

### 4. **actions**

Causal events connecting versions. The full set of supported `type` values is:

**Legislative Actions** (create or modify statutory text):
- `type: "Creation"` - Enacts new statutory text (e.g., EC 96/2017 creates Art. 225, §7)
- `type: "Amendment"` - Modifies existing statutory text
- `type: "Revocation"` - Removes statutory text from validity
- `type: "Repeal"` - Formally cancels legislation

**Judicial Actions** (create interpretive versions without altering statutory text):
- `type: "Interpretation"` - Establishes or clarifies the meaning of a provision, creating an I-TV
- `type: "Overruling"` - Explicitly reverses a prior judicial interpretation
- `type: "Distinguishing"` - Limits the applicability of a prior precedent based on factual or legal differences
- `type: "Constitutional Mutation"` - Reinterpretation that fundamentally alters the normative scope of a constitutional provision without textual amendment

**Hybrid Actions** (bridge legislative and judicial domains):
- `type: "Legislative Override"` - A legislative act specifically enacted to supersede a judicial interpretation

Key properties:

- `sourceVersionIds`: Array of Version IDs that authorize this action (e.g., judgment component versions). Can contain multiple sources when binding reasoning emerges from convergent rationale across multiple concurring opinions
- `producesVersionIds`: New version(s) instantiated by this action (array)
- `terminatesVersionIds`: Previous version(s) terminated by this action (array)
  - Empty `[]` for **initial** Interpretations overlaying S-TV (Cases A, B, C — first interpretation)
  - Empty `[]` for Creation actions adding new provisions (Case B: EC 96/2017 creates par7)
  - Contains previous I-TV ID for Overruling actions (Case A: ADCs 43/44/54 overrules HC 126.292)
  - Contains previous S-TV ID for Amendment actions modifying existing text
- `validityInterval`: The time interval imposed on the versions created by this action
- `applicabilityInterval`: *(optional)* The interval during which created versions can produce legal effects. Distinct from `validityInterval` — captures scenarios like temporary suspension of efficacy or tax precedence rules where applicability does not coincide with formal validity
- `metadata`: Additional context (court, chamber, rapporteur, etc.)

### 5. **sampleQueries**

Demonstrates API primitives using pseudocode notation. Corresponding REST endpoints:

| Pseudocode | REST Endpoint | Purpose |
|---|---|---|
| `getValidVersions(itemId, at)` | `GET /items/{itemId}/valid-versions?at={date}` | Returns all versions valid at a specific date (point-in-time normative state) |
| `getItemVersions(itemId)` | `GET /items/{itemId}/versions` | Returns every version ever produced for an item (full version history) |
| `getItemHistory(itemId)` | `GET /items/{itemId}/history` | Returns the ordered Action timeline (causal narrative) |
| `getActionsBySource(sourceWorkId)` | `GET /items/{sourceWorkId}/actions-caused` | Returns all Actions authorized by a given Work (forward impact tracing) |

**`getValidVersions` bi-temporal parameters:**
- `at` — Valid Time: which date to query (defaults to now)
- `observerTime` — Transaction Time: limits graph to events known at a past moment, enabling historical legal truth reproduction (e.g., professional liability analysis)

## Validation Against Real Legal System

### HC 126.292 - Factual Accuracy ✅

- [STF Official Notice - HC 126.292](https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=310153)
- [STF Official Notice - ADCs 43/44/54](https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=428003)

### ADI 4983 - Factual Accuracy ✅

- [STF Official Notice - ADI 4983](https://noticias.stf.jus.br/postsnoticias/stf-julga-inconstitucional-lei-cearense-que-regulamenta-vaquejada/)
- [Constitutional Amendment 96/2017](https://normas.leg.br/?urn=urn:lex:br:federal:emenda.constitucional:2017-06-06;96)

## Key Concept: Overlaying vs. Superseding

**Critical distinction for understanding the model:**

- **Superseding** (Legislative model): New version TERMINATES old version

  - Example: Amendment replaces statute text → old S-TV ends, new S-TV begins
  - Result: Only 1 version active at any time (`|V_valid| = 1`)
- **Overlaying** (Judicial model): New interpretation COEXISTS with statutory text

  - Example: Court ruling interprets constitution → S-TV stays active, I-TV overlays it
  - Result: Both versions active simultaneously (`|V_valid| = 2`)
  - Rationale: Statutory text remains authoritative for general citations and other interpretations

**Why overlaying matters:**

1. RAG systems need both the **literal text** (S-TV) and the **binding interpretation** (I-TV)
2. S-TV continues to apply to cases outside the I-TV's scope
3. Subsequent courts cite the **text** while applying the **interpretation**

This is reflected in the graph through `Action.terminatesVersionIds`:

- Judicial Interpretation: `[]` (doesn't terminate S-TV)
- Judicial Overruling: `[previous I-TV ID]` (terminates previous I-TV, not S-TV)
- Legislative Amendment: `[previous S-TV ID]` (terminates previous S-TV)

## Ontological Parsimony - No New Classes Required

All three cases are modeled using **only** the existing SAT-Graph primitives:


| Entity Type | Used In All Cases                       |
| ----------- | --------------------------------------- |
| `Item`      | ✅ Abstract identities                  |
| `Version`   | ✅ Temporal states (both S-TV and I-TV) |
| `Action`    | ✅ Legislative and judicial events      |
| `TextUnit`  | ✅ Canonical text, ratio, holding       |

**No additions to ontology:**

- ❌ No `Precedent` class
- ❌ No `JudicialInterpretation` class
- ❌ No new entity classes

The `Action.type` enum includes specialized values (`Interpretation`, `Overruling`, `Distinguishing`, `Constitutional Mutation`, `Legislative Override`) but these are discriminator values within the single `Action` class, not new classes.

**Only topological differences:**

- **Legislative events**: `S-TV → S-TV'` (terminate and replace)
- **Judicial interpretations**: `S-TV ⊕ I-TV` (overlay, both active)
- **Judicial overruling**: `I-TV → I-TV'` (replace previous interpretation, both overlay S-TV)

Reviewers can:

- Load datasets into any RDF/JSON graph processor
- Execute sample queries to verify deterministic retrieval
- Extend the model to their own jurisdictions

## File Format Conventions

### URN Structure

Following LexML URN standard (Brazil):

```
urn:lex:br:{authority}:{type}:{date};{number}[@version][!component][,variant]
```

Examples:

- `urn:lex:br:federal:constituicao:1988-10-05;1988!art5_inc57` - Component
- `urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art5_inc57` - Version of a component
- `urn:lex:br:federal:emenda.constitucional:2017-06-06;96!art1_cpt_alt1_art225_par7` - Amendment provision
- `urn:lex:br:stf:acordao:2016-02-17;hc.126292` - STF judgment
- `urn:lex:br:ceara:lei:2013-05-25;15299` - State law

### Version Identifiers

Pattern: `@{version_date}!{component}[,variant]`

- `@{date}!{component}` - Statutory Version at date with component identifier
- `@{date}!{component},{code}` - Interpretive Version created by case/code (e.g., `,hc126292`, `,adi4983`, `,re.fictitious-1`)
- `@{date}!{component}` - Component Version of a Judgment (e.g., `@2016-02-17!voto-zavascki`)



Authority Codes

- `federal` - Federal-level legislation (Constituição, Leis Federais, Emendas Constitucionais)
- `stf` - Supremo Tribunal Federal (Supreme Court)
- `stf.1turma` - STF First Panel decisions
- `stf.2turma` - STF Second Panel decisions
- `{state}` - State-level (e.g., `ceara` for Ceará State)

### TextUnit Aspects

Semantic roles following argumentation theory:

- `canonical` - Full authoritative text
- `ratio` - *Ratio decidendi* (binding reasoning)
- `holding` - Operative command/rule
- `facts` - Case facts
- `summary` - Human or LLM-generated summary

**Mapping to Brazilian Judgment Structure:**


| TextUnit Aspect | Structural Container (Brazilian STF) | Example                       |
| --------------- | ------------------------------------ | ----------------------------- |
| `facts`         | Relatório (Report)                  | Case background and arguments |
| `ratio`         | Voto (Vote)                          | Legal reasoning of rapporteur |
| `holding`       | Voto / Dispositivo                   | Operative ruling/command      |

## License

These datasets are released under **CC0 1.0 Universal (Public Domain)** for maximum reproducibility. All encoded judicial decisions are public domain materials from the Brazilian Supreme Court.
