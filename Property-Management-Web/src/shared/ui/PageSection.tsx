interface PageSectionProps {
  title: string
  route: string
  description: string
  bullets: string[]
}

export function PageSection({
  title,
  route,
  description,
  bullets,
}: PageSectionProps) {
  return (
    <article className="page-section">
      <div className="page-section-header">
        <div>
          <p className="eyebrow">Feature Module</p>
          <h3>{title}</h3>
        </div>
        <code>{route}</code>
      </div>
      <p>{description}</p>
      <ul>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </article>
  )
}
