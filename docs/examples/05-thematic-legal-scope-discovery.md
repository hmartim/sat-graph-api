# Use Case 5: Multi-Document Legal Scope Discovery via Structural Navigation

> **Based on:** Research Paper Section 5.4 - Agentic Planning for Semantic Queries

## User Query

_"In what situations can the right to strike be exercised in Brazil? What are the legal conditions and limitations?"_

## The Challenge

This query seeks to understand the **complete legal scope** of a constitutional right spread across multiple legal documents, which requires:

1. ❌ **Semantic Grounding:** Translate "right to strike" to canonical legal provisions across documents
2. ❌ **Multi-Document Navigation:** Find all related provisions across Constitution and regulatory decrees
3. ❌ **Scope Identification:** Understand when strikes are permitted vs. restricted
4. ❌ **Relational Context:** Connect primary rights with limitations and exceptions
5. ❌ **Synthesis:** Combine textual provisions with structural context

A standard RAG system would:
- ❌ Retrieve fragmented text snippets without structural understanding
- ❌ Miss related provisions across different legal documents due to flat indexing
- ❌ Lack causal links between primary rights and restrictions
- ❌ Cannot guarantee completeness of scope across multiple legal hierarchies

## Agent Execution Plan

The agent recognizes this requires **multi-document structural exploration** followed by **semantic synthesis**. Since thematic classification is not yet available for strike rights, the agent uses **direct reference resolution** combined with **structural navigation and relational queries**.

### Prerequisites

```bash
export API_KEY="your_api_key_here"
export BASE_URL="https://api.example.com"
```

---

## Step 1: Semantic Discovery and Grounding

Translate the natural language query into canonical legal references across multiple documents.

### Step 1a: Search for References in Legal Documents

First, perform a comprehensive text search (right to strike, "direito de greve" in Portuguese) for strike-related provisions across all documents.

```bash
curl -X POST "$BASE_URL/search-text-units" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "direito de greve",
    "language": "pt-br",
    "limit": 20
  }'
```

**Response:**

```json
{
  "results": [
    {
      "id": "text_unit_art9_constituicao_...",
      "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@1988-10-05!art9_cpt",
      "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art9_cpt",
      "label": "Artigo 9º, caput",
      "content_snippet": "É assegurado o direito de greve, competindo aos trabalhadores decidir sobre a oportunidade de exercê-lo...",
      "relevance": 0.99
    },
    {
      "id": "text_unit_art37_vii_constituicao",
      "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art37_vii",
      "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art37_vii",
      "label": "Artigo 37, Inciso VII - Direito de Greve do Servidor Público",
      "content_snippet": "o direito de greve será exercido nos termos e nos limites definidos em lei específica...",
      "relevance": 0.95
    },
    {
      "id": "text_unit_art114_ii_constituicao",
      "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art114_ii",
      "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art114_ii",
      "label": "Artigo 114, Inciso II - Jurisdição do Direito de Greve",
      "content_snippet": "as ações que envolvam exercício do direito de greve...",
      "relevance": 0.91
    },
    {
      "id": "text_unit_art142_iv_constituicao",
      "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art142_iv",
      "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art142_iv",
      "label": "Artigo 142, Parágrafo 3º, Inciso IV - Proibição para Militares",
      "content_snippet": "ao militar são proibidas a sindicalização e a greve...",
      "relevance": 0.88
    },
    {
      "id": "text_unit_decreto_1480_art1",
      "version_id": "urn:lex:br:federal:decreto:1480:1995-03-22;1995@2025-10-25!art1",
      "item_id": "urn:lex:br:federal:decreto:1480:1995-03-22;1995!art1",
      "label": "Decreto 1480/1995 Artigo 1º - Definição de Greve",
      "content_snippet": "Greve é a suspensão coletiva do trabalho por iniciativa dos empregados...",
      "relevance": 0.87
    }
  ],
  "total_results": 5
}
```

**Agent Logic:**

```python
search_results = search_text_units(
    query="direito de greve right to strike",
    language="pt-br",
    limit=20
)

# Extract canonical item IDs from search results
primary_item_id = search_results[0].item_id  # Article 9 - Constitution (primary right)
restriction_public_item_id = search_results[1].item_id  # Article 37, VII - Public servants
jurisdiction_item_id = search_results[2].item_id  # Article 114, II - Labor court jurisdiction
military_prohibition_item_id = search_results[3].item_id  # Article 142, III, IV - Military prohibition
regulatory_item_id = search_results[4].item_id  # Decree 1480/1995

# primary_item_id = "urn:lex:br:federal:constituicao:1988-10-05;1988!art9"
# restriction_public_item_id = "urn:lex:br:federal:constituicao:1988-10-05;1988!art37_vii"
# jurisdiction_item_id = "urn:lex:br:federal:constituicao:1988-10-05;1988!art114_ii"
# military_prohibition_item_id = "urn:lex:br:federal:constituicao:1988-10-05;1988!art142_iv"
# regulatory_item_id = "urn:lex:br:federal:decreto:1480:1995-03-22;1995!art1"
```

### Step 1b: Resolve and Verify Primary References

Ground the query by resolving direct references to specific legal provisions.

```bash
curl -G "$BASE_URL/resolve-item-reference" \
  -H "Authorization: $API_KEY" \
  --data-urlencode "reference_text=Article 9 of the Brazilian Constitution"
```

**Response:**

```json
[
  {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art9",
    "label": "Article 9 - Right to Strike",
    "type_id": "item-type:article",
    "confidence": 0.99
  }
]
```

**Agent Logic:**

```python
candidates = resolve_item_reference(
    reference_text="Article 9 of the Brazilian Constitution"
)
primary_provision_id = candidates[0].id
# primary_provision_id = "urn:lex:br:federal:constituicao:1988-10-05;1988!art9"
```

---

## Step 2: Parallel Multi-Path Exploration

The agent executes **three independent tasks in parallel** to gather comprehensive scope information from multiple legal documents.

> **Key Design Pattern:** These tasks are independent and can execute concurrently for maximum efficiency. Without themes, the agent uses structural navigation and direct item fetches discovered during search.

---

## Task A: Primary Provision Details (Constitutional Foundation)

**Goal:** Retrieve the current text, context, and related provisions of Article 9.

### Step A1: Get Current Constitutional Text

Fetch the valid text of Article 9 as of today.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art9/valid-version?timestamp=2025-10-25T00:00:00Z&policy=PointInTime"
```

**Response:**

```json
{
  "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art9",
  "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art9",
  "validity_interval": [
    "1988-10-05T00:00:00Z",
    null
  ]
}
```

**Agent Logic:**

```python
version_current = get_valid_version(
    item_id=primary_provision_id,
    timestamp="2025-10-25T00:00:00Z",
    policy="PointInTime"
)
primary_version_id = version_current.id
```

### Step A2: Retrieve Full Constitutional Text

Get the actual text of Article 9 in Portuguese.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/versions/urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art9/text-unit?language=pt-br"
```

**Response:**

```json
{
  "id": "text_unit_art9_pt_br",
  "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art9",
  "language": "pt-br",
  "aspect": "canonical",
  "content": "Art. 9º É assegurado o direito de greve, competindo aos trabalhadores decidir sobre a oportunidade de exercê-lo e sobre os interesses que devam por meio dele defender.\n§ 1º A lei definirá os serviços ou atividades essenciais e disporá sobre o atendimento das necessidades inadiáveis da comunidade.\n§ 2º Os abusos cometidos sujeitam os responsáveis às penas da lei."
}
```

**Agent Logic:**

```python
text_primary = get_text_unit(
    version_id=primary_version_id,
    language="pt-br"
)
primary_text = text_primary.content
```

### Step A3: Get Structural Context

Understand where Article 9 sits in the constitutional hierarchy.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art9/context"
```

**Response:**

```json
{
  "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art9",
  "parent": {
    "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!title2.chapter2",
    "label": "Chapter II - Social Rights",
    "type_id": "item-type:chapter"
  },
  "siblings": [
    {
      "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art6",
      "label": "Article 6 - Social Rights"
    },
    {
      "id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art10",
      "label": "Article 10 - Worker Representation"
    }
  ],
  "children": []
}
```

**Agent Logic:**

```python
context = get_item_context(item_id=primary_provision_id)
parent_chapter = context.parent
# Understand that this is a "Social Right" under Constitutional protection
```

---

## Task B: Regulatory Framework (Decree 1480/1995) and Complementary Constitutional Provisions

**Goal:** Retrieve detailed provisions from the regulatory decree and other constitutional articles that implement and restrict Article 9.

### Step B1: Get Constitutional Restrictions for Public Servants

Fetch Article 37, VII (public servant strike restrictions).

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art37_vii/valid-version?timestamp=2025-10-25T00:00:00Z&policy=PointInTime"
```

**Response:**

```json
{
  "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art37_vii",
  "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art37_vii",
  "validity_interval": [
    "1988-10-05T00:00:00Z",
    null
  ]
}
```

### Step B2: Batch Retrieve Multiple Provisions

Get Article 9's subsections (essential services definition), Article 37 VII (public servants), Article 114 III (labor court jurisdiction for strikes), and Article 142 IV (military prohibition).

```bash
curl -X POST "$BASE_URL/text-units/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version_ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art9_par1",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art37_vii",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art114_iii",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art142_par3_iv",
      "urn:lex:br:federal:decreto:1480:1995-03-22;1995@2025-10-25!art1"
    ],
    "language": "pt-br"
  }'
```

**Response:**

```json
[
  {
    "id": "text_art9_par1",
    "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art9_par1",
    "language": "pt-br",
    "content": "§ 1º A lei definirá os serviços ou atividades essenciais e disporá sobre o atendimento das necessidades inadiáveis da comunidade."
  },
  {
    "id": "text_art37_vii",
    "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art37_vii",
    "language": "pt-br",
    "content": "VII – o direito de greve será exercido nos termos e nos limites definidos em lei específica;"
  },
  {
    "id": "text_art114_iii",
    "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art114_iii",
    "language": "pt-br",
    "content": "III – as ações que envolvam exercício do direito de greve;"
  },
  {
    "id": "text_art142_par3_iv",
    "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art142_par3_iv",
    "language": "pt-br",
    "content": "IV – ao militar são proibidas a sindicalização e a greve;"
  },
  {
    "id": "text_decreto_1480_art1",
    "version_id": "urn:lex:br:federal:decreto:1480:1995-03-22;1995@2025-10-25!art1",
    "language": "pt-br",
    "content": "Art. 1º Greve é a suspensão coletiva do trabalho por iniciativa dos empregados, visando a obtenção de vantagens para os trabalhadores."
  }
]
```

**Agent Logic:**

```python
# Batch retrieve all key provisions
complementary_texts = get_batch_text_units(
    version_ids=[
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art9_par1",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art37_vii",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art114_iii",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art142_par3_iv",
      "urn:lex:br:federal:decreto:1480:1995-03-22;1995@2025-10-25!art1"
    ],
    language="pt-br"
)
```

---

## Task C: Categorical Exceptions and Prohibitions

**Goal:** Identify specific groups and categories with strike restrictions or prohibitions.

### Step C1: Focus Query on Exceptions

Note: Task C was already largely completed in Task B. However, let's explicitly fetch Article 142, Paragraph 3, Item IV (military prohibition) and Article 114's jurisdictional provision.

```bash
curl -H "Authorization: $API_KEY" \
  "$BASE_URL/items/urn:lex:br:federal:constituicao:1988-10-05;1988!art142_par3_iv/valid-version?timestamp=2025-10-25T00:00:00Z&policy=PointInTime"
```

**Response:**

```json
{
  "id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art142_par3_iv",
  "item_id": "urn:lex:br:federal:constituicao:1988-10-05;1988!art142_par3_iv",
  "validity_interval": [
    "1988-10-05T00:00:00Z",
    null
  ]
}
```

### Step C2: Get Complete Exception Provisions

Fetch full context of essential services definition (Article 9, Section 1) and jurisdictional framework (Article 114, Section 3).

```bash
curl -X POST "$BASE_URL/text-units/batch-get" \
  -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version_ids": [
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art9_par2",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art114_par3"
    ],
    "language": "pt-br"
  }'
```

**Response:**

```json
[
  {
    "id": "text_art9_par2",
    "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art9_par2",
    "language": "pt-br",
    "content": "§ 2º Os abusos cometidos sujeitam os responsáveis às penas da lei."
  },
  {
    "id": "text_art114_par3",
    "version_id": "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art114_par3",
    "language": "pt-br",
    "content": "§ 3º Em caso de greve em atividade essencial, com possibilidade de lesão do interesse público, o Ministério Público do Trabalho poderá ajuizar dissídio coletivo, competindo à Justiça do Trabalho decidir o conflito."
  }
]
```

**Agent Logic:**

```python
exception_texts = get_batch_text_units(
    version_ids=[
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art9_par2",
      "urn:lex:br:federal:constituicao:1988-10-05;1988@2025-10-25!art114_par3"
    ],
    language="pt-br"
)
```

---

## Step 3: Synthesized Outcome

The agent now has comprehensive, auditable data to synthesize into a complete answer from the three parallel tasks.

### Data Available for Synthesis

```python
synthesis_data = {
    "primary_right": {
        "provision": primary_text,  # Article 9, Constitutional
        "source_id": primary_provision_id,
        "validity": "Current (since 1988-10-05)",
        "hierarchical_context": "Chapter II - Social Rights"
    },
    "constitutional_framework": {
        "general_right": "Art. 9º - Strike right guaranteed for workers",
        "essential_services": "Art. 9º § 1º - Law defines essential services and requirements",
        "penalties": "Art. 9º § 2º - Abuses subject to legal penalties",
        "public_servants": "Art. 37, VII - Regulated by specific law",
        "court_jurisdiction": "Art. 114, II & III - Labor court jurisdiction over strike disputes",
        "military_prohibition": "Art. 142, § 3º, IV - Prohibited for military personnel"
    },
    "regulatory_framework": {
        "implementing_decree": "Decree 1480/1995 (May 3, 1995)",
        "purpose": "Procedures for federal public service work stoppages",
        "provisions": {
            "article_1": "Absences from work stoppages cannot be compensated, absolved, or counted toward service time",
            "article_2": "Immediate exoneration/dismissal of commission holders and gratified function holders",
            "article_3": "Denunciation to lide of servers responsible for damages from work stoppages"
        }
    },
    "scope_analysis": {
        "private_sector_workers": "Full constitutional right to strike (Art. 9)",
        "public_servants": "Regulated by law with restrictions (Art. 37, VII + Decree 1480)",
        "military_personnel": "Absolutely prohibited (Art. 142, § 3º, IV)",
        "essential_services": "Subject to minimum service requirements (Art. 9, § 1º)"
    }
}
```

### Generated Response

> "In Brazil, **the right to strike is constitutionally guaranteed** as a fundamental social right under **Article 9 of the Brazilian Constitution**, which establishes: _'Art. 9º É assegurado o direito de greve, competindo aos trabalhadores decidir sobre a oportunidade de exercê-lo e sobre os interesses que devam por meio dele defender.'_ (The right to strike is guaranteed, with workers deciding when to exercise it and what interests to pursue through it.)
>
> ## Constitutional and Legal Framework
>
> The Constitution establishes a **two-tiered framework** for strike rights based on employment category:
>
> **A. Private Sector Workers - Full Right to Strike**
> - Constitutionally guaranteed without restriction (Article 9)
> - Workers decide both timing and objectives
> - Essential services defined by law will have specific procedures (Article 9, § 1º)
> - Abuses subject to legal penalties (Article 9, § 2º)
>
> **B. Public Servants - Regulated Right to Strike**
> - According to Article 37, Section VII: _'o direito de greve será exercido nos termos e nos limites definidos em lei específica'_ (strike right shall be exercised within terms and limits defined by specific law)
> - Implemented through **Decree 1480 of May 3, 1995** for federal public service
>
> ## Legal Status of Work Stoppages in Federal Public Service (Decree 1480/1995)
>
> Decree 1480/1995 addresses work stoppages (_paralisações_) in federal public services while awaiting complementary law on Article 37, VII. The key provisions are:
>
> **Article 1 - Absence Rules for Work Stoppages:**
> - Absences from federal public servants participating in work stoppages **cannot be**:
>   - Forgiven (abonadas)
>   - Compensated (compensadas)
>   - Counted toward service time or any benefits based on service time
>
> **Article 2 - Consequences for Leadership:**
> - Commission holders and gratified function holders participating in work stoppages **are immediately exonerated or dismissed**
>
> **Article 3 - Liability for Damages:**
> - When Union, autarquias, or public foundations are sued for damages from interrupted services due to work stoppages, **denunciation to lide is mandatory** for the public servers responsible
>
> ## Categories of Strike Rights: Complete Analysis
>
> ### 1. **Private Sector Workers** ✅ Full Right
> - Constitutional guarantee without restriction
> - Can organize and decide timing/objectives
>
> ### 2. **Federal Public Servants** ⚠️ Restricted Right
> - Right recognized but strictly regulated
> - Absences not forgiven or compensated
> - Leadership subject to immediate dismissal
> - Personally liable for damages caused
> - Subject to Decree 1480/1995 framework
>
> ### 3. **State and Municipal Public Servants** ⚠️ Regulated by State Law
> - Article 37, VII applies to all public administration levels
> - Each state/municipality has supplementary laws
> - Decree 1480/1995 applies specifically to federal level
>
> ### 4. **Military Personnel** ❌ Absolutely Prohibited
> - Article 142, Paragraph 3, Item IV: _'ao militar são proibidas a sindicalização e a greve'_ (to military members are prohibited both unionization and strikes)
> - Complete prohibition, no exceptions
>
> ## Judicial Framework
>
> **Labor Court Jurisdiction (Article 114, II & III):**
> - Labor courts have jurisdiction over actions involving exercise of strike rights
> - Court jurisdiction over strike disputes (Article 114, § 3º): _'Em caso de greve em atividade essencial, com possibilidade de lesão do interesse público, o Ministério Público do Trabalho poderá ajuizar dissídio coletivo'_ (In case of strikes in essential activities with public interest risk, Labor Public Ministry may file collective dispute)
>
> ## Summary: When Strike Rights Can Be Exercised
>
> **The right to strike in Brazil is constitutionally protected but differentiated by employment category:**
>
> 1. **✅ Private Sector:** Full, unrestricted constitutional right (Article 9)
> 2. **⚠️ Federal Public Servants:** Right exists but heavily restricted by Decree 1480/1995 - absences not compensated, leaders dismissed, personal liability for damages
> 3. **⚠️ Other Public Servants:** Right regulated by respective state/municipal supplementary laws (Article 37, VII)
> 4. **❌ Military:** Absolutely prohibited by Constitution (Article 142, § 3º, IV)
> 5. **📋 Essential Services:** Subject to legal definition and minimum service requirements (Article 9, § 1º)
>
> **All claims are backed by canonical legal sources:**
> - Brazilian Constitution (1988): Articles 9, 37.VII, 114, 142
> - Decree 1480 of May 3, 1995 (Articles 1, 2, 3)"

---

## Key Takeaways

✅ **Multi-Document Search:** Text search across all documents identifies relevant provisions in constitutional and regulatory documents

✅ **Semantic Grounding:** Reference resolution enables translation of natural language concepts to canonical provisions

✅ **Parallel Exploration:** Multiple independent queries (constitutional text, regulatory framework, restrictions) execute concurrently for efficiency

✅ **Comprehensive Scope:** Structural navigation and direct fetches reveal complete legal framework across multiple documents and hierarchical levels

✅ **Regulatory Framework:** Batch operations efficiently load all articles from implementing decrees

✅ **Verifiable Claims:** Every statement backed by canonical IDs, valid versions, and auditable source texts

✅ **Cross-Document Synthesis:** Combines constitutional right with regulatory implementation details

### Capabilities Impossible for Standard RAG Systems

| Capability | Standard RAG | SAT-Graph API |
|------------|--------------|---------------|
| **Find provisions across multiple documents** | ❌ Flat search across all text | ✅ Structured search-text-units with item IDs |
| **Understand legal scope completely** | ❌ Fragmented results | ✅ Structural navigation + multi-document fetching |
| **Connect constitutional rights with regulations** | ❌ Manual correlation required | ✅ Direct item-to-item relationships |
| **Synthesize across documents** | ❌ Limited context | ✅ Coordinated multi-document retrieval |
| **Guarantee version accuracy** | ❌ Cannot verify recency | ✅ Deterministic valid-version queries |
| **Execute in parallel efficiently** | ❌ Sequential retrieval | ✅ DAG-based execution |

---

## Execution Pattern Summary

```
Initial Grounding (Sequential):
├── search_text_units() [finds relevant items across documents]
└── resolve_item_reference() [verifies primary provision]

Parallel Exploration (Task A ‖ Task B ‖ Task C):
├── Task A: Constitutional Foundation
│   ├── get_valid_version()
│   ├── get_text_unit()
│   └── get_item_context()
│
├── Task B: Regulatory Framework (Decree 1480/1995)
│   ├── get_valid_version()
│   └── batch_get_text_units() [Articles 1-4]
│
└── Task C: Public Servant Restrictions
    ├── get_valid_version()
    └── get_text_unit()

Synthesis (Sequential):
└── Combine constitutional + regulatory + restrictions → comprehensive answer
```

---

## Real-World Legal Sources

This example is grounded in Brazil's actual legal framework:

### Constitutional Provisions
- **Article 9 - Right to Strike:** [Brazilian Constitution 1988 - Article 9](https://normas.leg.br/?urn=urn:lex:br:federal:constituicao:1988-10-05;1988) ([Official Source](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm))
  - § 1º - Essential services definition
  - § 2º - Penalties for abuses
- **Article 37, VII - Public Servant Strike Rights:** Regulated by specific law
- **Article 114, II & III - Labor Court Jurisdiction:** Over strike-related disputes and actions
- **Article 142, § 3º, IV - Military Prohibition:** Absolute prohibition for military personnel

### Regulatory Framework
- **Decree 1480 of May 3, 1995:** [Procedures for Federal Public Service Work Stoppages](https://www.planalto.gov.br/ccivil_03/decreto/d1480.htm)
  - **Article 1:** Absences from work stoppages cannot be forgiven, compensated, or counted toward service time
  - **Article 2:** Immediate exoneration/dismissal of commission holders and gratified function holders
  - **Article 3:** Mandatory denunciation to lide for servers responsible for damages from work stoppages

---

## Key Insights for API Design

This use case demonstrates **critical API capabilities** for legal analysis:

1. **Multi-Document Search** - Finds related provisions across Constitution and Decrees using semantic similarity ("greve" and "paralisações")
2. **Hierarchical Navigation** - Discovers constitutional hierarchy (Chapter II - Social Rights) and jurisdiction (Labor Courts)
3. **Cross-Document Correlation** - Links implementing decrees with constitutional provisions
4. **Temporal Accuracy** - Tracks multiple versions and validity periods across documents
5. **Comprehensive Scope** - Discovers all affected categories (private sector, public servants, military)
6. **Regulatory Framework** - Shows how constitutional rights are implemented and restricted through decrees
7. **Deterministic Versioning** - Ensures answers reflect current valid versions of all sources

This use case demonstrates how the SAT-Graph API enables sophisticated legal analysis for conceptual questions, moving beyond keyword matching to provide complete, auditable scope discovery across multiple legal documents while maintaining deterministic version accuracy and verifiability.
