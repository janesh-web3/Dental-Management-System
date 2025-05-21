import React from "react";

interface PageTitleProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export default function PageTitle({ heading, text, children }: PageTitleProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}
