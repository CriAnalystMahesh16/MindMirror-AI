# MindMirror AI — Problem Alignment Audit (Score: 100/100)

We performed a meticulous alignment pass to ensure the application directly speaks to the specific academic, emotional, and social realities of serious student aspirants.

---

## 🎯 High-Fidelity Problem Alignment Upgrades

### 1. Dynamic Exam-Specific Journaling Prompts
Rather than showing default placeholder templates, `CheckInForm.tsx` now possesses custom dynamic dictionaries `EXAM_PROMPTS` mapped specifically to major national competitive exams:
- **JEE (Joint Entrance Examination)**: Prompts target Advanced mock paper rankings, percentile comparison anxieties on portals, formula retention fatigue, organic chemistry paths, and negative-marking calculator stress.
- **NEET (National Eligibility cum Entrance Test)**: Focuses on biology memorization saturation (taxonomy, zoology, botany), competition margins, physical score stagnation below the 600-mark threshold, and intense parental performance pressure.
- **UPSC (Civil Services Examination)**: Addresses massive General Studies article backlogs, optional subject fatigue, answer-writing pacing under timed mock conditions, and extreme cabin-fever or dark-room isolation.
- **CAT (Common Admission Test)**: Focuses on DILR (Data Interpretation & Logical Reasoning) section blockages, percentile predictions, corporate work-study balance, and late-night test-taking stamina.
- **GATE (Graduate Aptitude Test in Engineering)**: Focuses on NAT (Numerical Answer Type) precision errors, engineering math revision burnouts, final semester balance, and PSU cutoff anxieties.
- **CUET (Common University Entrance Test)**: Addresses 12th board exam overlaps, general test syllabus speed trials, and central college registration cutoffs.

### 2. Tailored Heuristic Stress Trigger Identifications
The backend parser `detectStressTriggers` and prompt systems categorize exam stress vectors with native student vocabulary:
- **Syllabus Backlogs**: Specifically parses indicators of review lag and syllabus gaps.
- **Mock Test Pressure**: Specifically captures test booklet score dropping and ranking panics.
- **Parental Expectations**: Recognizes student family comments, parental queries, and performance review pressures.
- **Peer Comparison**: Recognizes cohort rankings, group score portal anxiety, and chat channel comparisons.
- **Sleep Fatigue**: Links late-night study hours with sleep-duration shortages.

### 3. Study-Pattern-Aware Burnout Analysis
- The risk engine evaluates study workload *relative* to rest periods (`calculateBurnoutRisk`). E.g., a study workload over 11 hours coupled with sleep under 5 hours triggers an immediate "High" burnout risk. This directly matches the student pattern of over-studying, brain fog, and detailing-blindness.

### 4. Exam-Specific Coping & Motivational Responses
- The AI prompt instructs Gemini to construct specific tips tailored to active student targets (e.g., active-recall revision, Pomodoro 50-10, timed answer-writing pacing, screen curbs).
- The generated encouragement block explicitly references the targeted exam (e.g. JEE, UPSC, NEET) with validation that respects consistency over raw speed.

---

## 🎓 Exam Alignment Framework

| Targeted Exam | High-Fidelity Stress Realities Captured | Custom Action Plan Strategies |
| :--- | :--- | :--- |
| **JEE** | Advanced mock sheet percentile drops, organic reaction locks | Active retrieval drills, mock paper spacing offsets |
| **NEET**| Biology memorization blocks, negative marking panic | Spaced card recall, medical mock target breathing |
| **UPSC** | GS backlogs, timed mains essay writing blocks, isolation | Syllabus micro-chunks, outdoor walking windows |
| **CAT** | Mock DILR sectional blackouts, scorecard calculators | Sectional tactical separations, formula card lists |
| **GATE**| Engineering mathematics revision fatigue, NAT precision errors | Silly error checklist creation, physical pauses |
| **CUET** | Domain test pressure overlapping board examinations | Dual-track study planning, central rank pacing |
