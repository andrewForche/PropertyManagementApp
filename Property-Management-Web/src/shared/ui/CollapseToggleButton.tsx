type CollapseToggleButtonProps = {
  isExpanded: boolean
  onClick: () => void
  collapseLabel: string
  expandLabel: string
}

export function CollapseToggleButton({
  isExpanded,
  onClick,
  collapseLabel,
  expandLabel,
}: CollapseToggleButtonProps) {
  const label = isExpanded ? collapseLabel : expandLabel

  return (
    <button
      type="button"
      className="secondary-button icon-button"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className={`chevron-icon ${isExpanded ? 'expanded' : ''}`}
      >
        <path
          d="M5.5 7.5L10 12l4.5-4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </button>
  )
}

CollapseToggleButton.displayName = 'CollapseToggleButton'
