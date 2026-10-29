function blockEvent(event) {
  event.preventDefault()
}

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  onSelect,
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-primary-500">
        Question {questionNumber} of {totalQuestions}
      </p>

      <div
        onCopy={blockEvent}
        onCut={blockEvent}
        onContextMenu={blockEvent}
        onDragStart={blockEvent}
        className="mt-2 select-none"
      >
        <h2 className="text-xl font-semibold leading-snug text-ink">{question.questionText}</h2>
      </div>

      <fieldset className="mt-6">
        <legend className="sr-only">Choose an answer</legend>
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = option.id === selectedOptionId
            return (
              <label
                key={option.id}
                onCopy={blockEvent}
                onCut={blockEvent}
                onContextMenu={blockEvent}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors select-none ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                    : 'border-primary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => onSelect(option.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary-500"
                />
                <span className="text-sm font-medium leading-relaxed text-ink">
                  {option.label}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
