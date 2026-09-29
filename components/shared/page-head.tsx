type PageHeadProps = {
  title: string;
  /** Small line above the title. */
  context?: string;
  /** Actions shown on the right. */
  children?: React.ReactNode;
};

export function PageHead({ title, context, children }: PageHeadProps) {
  return (
    <header className="page-head">
      <div>
        {context && <p className="page-context">{context}</p>}
        <h1>{title}</h1>
      </div>
      {children}
    </header>
  );
}
