# Edit Quiz Page Redesign — Two-Column Layout

## Current Issues at `/admin/quiz/[id]`

1. ❌ AI Generator section has gradient background (not matching design system)
2. ❌ Single-column layout makes it hard to find sections
3. ❌ Quiz details and questions are mixed together
4. ❌ No clear visual hierarchy
5. ❌ Add question form is buried at the bottom

## Required Two-Column Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Page Header (Back link, Title, Actions)                     │
├──────────────────────────┬──────────────────────────────────┤
│ LEFT COLUMN (65%)        │ RIGHT COLUMN (35%)               │
│                          │                                  │
│ ┌──────────────────────┐ │ ┌──────────────────────────────┐│
│ │ AI GENERATOR         │ │ │ QUIZ SETTINGS (sticky)       ││
│ │ (accent-stripe)      │ │ │                              ││
│ │ - Topic input        │ │ │ - Title                      ││
│ │ - Count selector     │ │ │ - Description                ││
│ │ - Generate button    │ │ │ - Time Limit                 ││
│ │ - Test AI link       │ │ │ - Question Limit             ││
│ │                      │ │ │ - Tags                       ││
│ │ Generated Questions  │ │ │ - Save button                ││
│ │ (if any)             │ │ │                              ││
│ └──────────────────────┘ │ │ Status info                  ││
│                          │ │ - Current badge              ││
│ ┌──────────────────────┐ │ │ - Publish/Unpublish link     ││
│ │ QUESTIONS LIST       │ │ │                              ││
│ │                      │ │ │ ─────────────────────────    ││
│ │ - Section header     │ │ │ DANGER ZONE                  ││
│ │ - Count badge        │ │ │ - Delete button              ││
│ │ - Add Question btn   │ │ └──────────────────────────────┘│
│ │                      │ │                                  │
│ │ Question cards       │ │                                  │
│ │ (each with edit/del) │ │                                  │
│ │                      │ │                                  │
│ │ ─────────────────    │ │                                  │
│ │ ADD/EDIT FORM        │ │                                  │
│ │ (inline, appears     │ │                                  │
│ │  when adding/editing)│ │                                  │
│ └──────────────────────┘ │                                  │
│                          │                                  │
│ (scrolls independently)  │ (sticky, stays in view)          │
└──────────────────────────┴──────────────────────────────────┘
```

## Detailed Changes

### 1. Page Shell
```tsx
<div className="max-w-[1200px] mx-auto px-6 py-8">
  {/* Page header */}
  <div className="flex items-center justify-between mb-8">
    <div>
      <h1 className="font-sans font-semibold" style={{ fontSize: '1.375rem' }}>
        {quiz.title}
      </h1>
      <p className="font-sans text-foreground-muted" style={{ fontSize: '0.875rem', marginTop: '2px' }}>
        {questions.length} questions · {quiz.isPublished ? 'Published' : 'Draft'} · Created {date}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={() => router.push("/admin")}>
        ← Dashboard
      </Button>
      <Button 
        variant={quiz.isPublished ? "outline" : "default"}
        onClick={handlePublishToggle}
      >
        {quiz.isPublished ? "Unpublish" : "Publish"}
      </Button>
      <Button variant="ghost" onClick={handleDeleteQuiz} className="text-destructive hover:text-destructive">
        <svg>...</svg> {/* trash icon */}
      </Button>
    </div>
  </div>

  {/* Two-column layout */}
  <div className="grid gap-6 lg:grid-cols-[65%_35%]">
    {/* Left column */}
    <div className="space-y-5">
      {/* AI Generator + Questions */}
    </div>
    
    {/* Right column */}
    <div>
      {/* Quiz Settings (sticky) */}
    </div>
  </div>
</div>
```

### 2. AI Generator Section (Left Column, Top)

**Remove:**
- ❌ `bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50`
- ❌ `border-2 border-violet-300`
- ❌ Sparkle badge decorations
- ❌ Icon in header
- ❌ "AI Powered" badge

**Replace with:**
```tsx
<div 
  className="surface-raised accent-stripe"
  style={{
    padding: '24px',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-raised)',
  }}
>
  {/* Section label */}
  <div className="flex items-center gap-2 mb-4">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {/* lightning bolt icon */}
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
    <span 
      className="font-sans font-semibold uppercase"
      style={{ 
        fontSize: '0.7rem', 
        letterSpacing: '0.08em',
        color: 'var(--purple-600)' 
      }}
    >
      AI Generator
    </span>
  </div>

  {/* Input row */}
  <div className="flex gap-3 mb-3">
    <Input 
      placeholder="Enter a topic, e.g. 'JavaScript closures'"
      value={topic}
      onChange={(e) => setTopic(e.target.value)}
      className="flex-1"
    />
    <Input 
      type="number"
      min={1}
      max={10}
      value={count}
      onChange={(e) => setCount(Number(e.target.value))}
      className="w-20"
    />
    <Button 
      variant="default"
      onClick={handleGenerate}
      disabled={aiLoading || !topic.trim()}
    >
      {aiLoading ? "Generating..." : "Generate"}
    </Button>
  </div>

  {/* Test AI link */}
  <div className="text-right">
    <button
      onClick={handleTestAi}
      className="text-xs text-foreground-muted hover:text-purple-500 transition-colors"
    >
      Test AI connection →
    </button>
  </div>

  {/* Error/Status */}
  {aiError && (
    <div 
      className="mt-3 px-3 py-2 rounded-input"
      style={{
        background: 'var(--destructive-surface)',
        border: '1px solid var(--destructive)',
        borderOpacity: 0.3
      }}
    >
      <p className="text-sm text-destructive">{aiError}</p>
    </div>
  )}

  {/* Generated Questions Preview */}
  {aiQuestions.length > 0 && (
    <div className="mt-5 space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-sm font-medium text-foreground">Generated Questions</span>
        <Button 
          size="sm"
          variant="default"
          onClick={handleAddAllAiQuestions}
          disabled={bulkAdding}
        >
          {bulkAdding ? "Adding..." : `Add All (${aiQuestions.length})`}
        </Button>
      </div>

      {aiQuestions.map((q, index) => (
        <div 
          key={index}
          className="p-4 rounded-input"
          style={{
            background: 'oklch(0.94 0.030 292 / 0.4)',
            border: '1px solid var(--purple-200)'
          }}
        >
          {/* Question number */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="tag text-xs">Q{index + 1}</span>
            <Button 
              size="xs"
              variant="outline"
              onClick={() => handleAddAiQuestion(q)}
              disabled={actionId === q.questionText}
            >
              Add to quiz
            </Button>
          </div>

          {/* Question text */}
          <p className="font-sans font-medium text-foreground text-sm mb-2">
            {q.questionText}
          </p>

          {/* Options */}
          <div className="space-y-1">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: oi === q.correctIndex ? 'var(--success)' : 'transparent',
                    border: oi === q.correctIndex ? 'none' : '1.5px solid var(--border-strong)'
                  }}
                />
                <span className="text-xs text-foreground-muted">{opt}</span>
              </div>
            ))}
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs italic text-foreground-faint">
                <span className="font-sans uppercase text-[0.65rem] not-italic">Explanation:</span> {q.explanation}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</div>
```

### 3. Questions List Section (Left Column, Below AI)

```tsx
<div className="space-y-4">
  {/* Section header */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <h2 className="font-sans font-semibold text-foreground" style={{ fontSize: '0.95rem' }}>
        Questions
      </h2>
      <span className="tag">{questions.length} total</span>
    </div>
    <Button 
      size="sm"
      variant="outline"
      onClick={() => {
        resetQuestionForm();
        // Scroll to form
      }}
    >
      Add Question
    </Button>
  </div>

  {/* Questions list */}
  {questions.length === 0 ? (
    <div className="text-center py-8">
      <p className="text-foreground-muted mb-1">No questions yet</p>
      <p className="text-xs text-foreground-faint">Use the AI generator above or add manually.</p>
    </div>
  ) : (
    <div className="space-y-2">
      {questions.map((q, index) => (
        <div 
          key={q.id}
          className="surface p-4 rounded-input"
        >
          <div className="flex items-start gap-3">
            {/* Drag handle (optional) */}
            <div className="flex-shrink-0 text-foreground-faint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                {/* 6 dots grip icon */}
                <circle cx="9" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="9" cy="19" r="2"/>
                <circle cx="15" cy="5" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="15" cy="19" r="2"/>
              </svg>
            </div>

            {/* Order number */}
            <span className="font-mono text-xs text-foreground-faint flex-shrink-0">
              {q.order ?? index}
            </span>

            {/* Question content */}
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground line-clamp-2 mb-1">
                {q.questionText}
              </p>
              <p className="text-xs text-foreground-faint">
                {q.options.slice(0, 2).join(", ")}...
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleEditQuestion(q)}
                className="w-7 h-7 flex items-center justify-center rounded-input text-foreground-muted hover:bg-purple-100 hover:text-foreground transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {/* pencil icon */}
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                onClick={() => handleDeleteQuestion(q)}
                disabled={actionId === q.id}
                className="w-7 h-7 flex items-center justify-center rounded-input text-foreground-muted hover:bg-purple-100 hover:text-destructive transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {/* trash icon */}
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}

  {/* Add/Edit Question Form (inline) */}
  {(editingQuestionId || showAddForm) && (
    <div 
      className="surface-raised p-5 rounded-card"
      style={{
        border: '1px solid var(--border-accent)'
      }}
    >
      <h3 className="font-sans font-semibold text-foreground mb-4" style={{ fontSize: '0.9rem' }}>
        {editingQuestionId ? "Edit Question" : "Add Question"}
      </h3>

      <form onSubmit={handleQuestionSubmit} className="space-y-4">
        {/* Question Text */}
        <div>
          <textarea
            value={questionForm.questionText}
            onChange={(e) => setQuestionForm(p => ({ ...p, questionText: e.target.value }))}
            placeholder="Enter your question..."
            className="w-full px-3 py-2 rounded-input border border-border bg-input text-sm resize-none"
            rows={3}
            required
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-foreground-faint mb-2">
            Options
          </label>
          <div className="space-y-2">
            {questionForm.options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2">
                {/* Radio-style selector */}
                <button
                  type="button"
                  onClick={() => setQuestionForm(p => ({ ...p, correctIndex: index }))}
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors"
                  style={{
                    border: '1.5px solid var(--border-strong)',
                    background: questionForm.correctIndex === index ? 'var(--success)' : 'transparent'
                  }}
                >
                  {questionForm.correctIndex === index && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </button>

                {/* Option label */}
                <span className="font-mono text-xs text-foreground-faint w-4">
                  {String.fromCharCode(65 + index)}
                </span>

                {/* Option input */}
                <Input
                  value={opt}
                  onChange={(e) => {
                    const opts = [...questionForm.options];
                    opts[index] = e.target.value;
                    setQuestionForm(p => ({ ...p, options: opts }));
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className="flex-1"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        {/* Explanation & Order */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-wider text-foreground-faint mb-1">
              Explanation (optional)
            </label>
            <textarea
              value={questionForm.explanation}
              onChange={(e) => setQuestionForm(p => ({ ...p, explanation: e.target.value }))}
              className="w-full px-3 py-2 rounded-input border border-border bg-input text-sm resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-foreground-faint mb-1">
              Order
            </label>
            <Input
              type="number"
              value={questionForm.order}
              onChange={(e) => setQuestionForm(p => ({ ...p, order: Number(e.target.value) }))}
              className="w-20"
            />
          </div>
        </div>

        {/* Error */}
        {questionError && (
          <p className="text-sm text-destructive">{questionError}</p>
        )}

        {/* Form footer */}
        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" variant="default">
            {editingQuestionId ? "Update Question" : "Save Question"}
          </Button>
          <Button 
            type="button" 
            variant="ghost"
            onClick={resetQuestionForm}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )}
</div>
```

### 4. Quiz Settings (Right Column, Sticky)

```tsx
<div 
  className="surface-raised p-6 rounded-card"
  style={{
    position: 'sticky',
    top: '24px',
    boxShadow: 'var(--shadow-raised)'
  }}
>
  {/* Section label */}
  <h2 
    className="font-sans font-semibold uppercase mb-5"
    style={{
      fontSize: '0.7rem',
      letterSpacing: '0.08em',
      color: 'var(--foreground-faint)'
    }}
  >
    Quiz Settings
  </h2>

  {/* Fields */}
  <div className="space-y-4">
    {/* Title */}
    <div>
      <label className="block text-xs uppercase tracking-wider text-foreground-muted mb-1">
        Title
      </label>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <p className="text-xs text-foreground-faint mt-1 text-right">
        {title.length}/100
      </p>
    </div>

    {/* Description */}
    <div>
      <label className="block text-xs uppercase tracking-wider text-foreground-muted mb-1">
        Description
      </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 rounded-input border border-border bg-input text-sm resize-none"
        rows={3}
      />
    </div>

    {/* Time Limit */}
    <div>
      <label className="block text-xs uppercase tracking-wider text-foreground-muted mb-1">
        Time Limit
      </label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          className="flex-1"
        />
        <span className="text-sm text-foreground-muted">min</span>
      </div>
    </div>

    {/* Question Limit */}
    <div>
      <label className="block text-xs uppercase tracking-wider text-foreground-muted mb-1">
        Questions per attempt
      </label>
      <Input
        type="number"
        min={1}
        max={30}
        value={questionLimit}
        onChange={(e) => setQuestionLimit(e.target.value)}
      />
    </div>

    {/* Tags */}
    <div>
      <label className="block text-xs uppercase tracking-wider text-foreground-muted mb-1">
        Tags
      </label>
      <Input
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="comma, separated, tags"
      />
      {/* Tag preview */}
      {tagsInput && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tagsInput.split(",").map((tag, i) => {
            const trimmed = tag.trim();
            return trimmed ? (
              <span key={i} className="tag text-xs">{trimmed}</span>
            ) : null;
          })}
        </div>
      )}
    </div>
  </div>

  {/* Save button */}
  <Button
    onClick={handleQuizSave}
    disabled={savingQuiz}
    className="w-full mt-5"
    variant="default"
  >
    {savingQuiz ? "Saving..." : "Save Changes"}
  </Button>

  {/* Status info */}
  <div className="mt-4 pt-4 border-t border-border">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-foreground-muted">Status:</span>
      <span className={`tag text-xs ${quiz.isPublished ? 'bg-success-surface text-success' : 'bg-warning-surface text-warning'}`}>
        {quiz.isPublished ? "Published" : "Draft"}
      </span>
    </div>
    <button
      onClick={handlePublishToggle}
      className="text-xs text-purple-500 hover:text-purple-600 underline"
    >
      {quiz.isPublished ? "Unpublish this quiz" : "Publish this quiz"}
    </button>
  </div>

  {/* Danger zone */}
  <div className="mt-6 pt-6 border-t border-border">
    <h3 
      className="text-xs uppercase tracking-wider mb-3"
      style={{ color: 'var(--destructive)' }}
    >
      Danger Zone
    </h3>
    <Button
      onClick={handleDeleteQuiz}
      disabled={actionId === quiz.id}
      variant="outline"
      className="w-full text-destructive border-destructive hover:bg-destructive-surface"
    >
      Delete Quiz
    </Button>
  </div>
</div>
```

## Summary of Changes

### Visual Changes:
1. ✅ Two-column layout (65% / 35%)
2. ✅ AI Generator: `surface-raised` + `accent-stripe` (purple left border)
3. ✅ Questions list: Clean card-based layout with drag handles
4. ✅ Add/Edit form: Inline with purple accent border
5. ✅ Quiz settings: Sticky right column
6. ✅ All using design system tokens (no gradients)

### UX Improvements:
1. ✅ Clear visual hierarchy
2. ✅ AI generator at top (most powerful feature)
3. ✅ Questions list easily scannable
4. ✅ Settings always visible (sticky)
5. ✅ Add question form inline (not buried)
6. ✅ Radio-style correct answer selector (clearer than dropdown)

### Preserved:
- ✅ All API calls and data fetching
- ✅ All state management
- ✅ All form validation
- ✅ All error handling
- ✅ AI generation logic
- ✅ Question CRUD operations

This redesign makes the edit quiz page much more usable and visually consistent with the design system!
