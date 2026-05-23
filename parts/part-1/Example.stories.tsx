import type { Meta, StoryObj } from "@storybook/react";

interface ChecklistItem {
  label: string;
  completed: boolean;
}

interface HackathonCardProps {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  checklist: ChecklistItem[];
}

function HackathonCard({ title, description, difficulty, checklist }: HackathonCardProps) {
  const difficultyColor =
    difficulty === "beginner"
      ? "oklch(0.527 0.154 149.9)"
      : difficulty === "intermediate"
        ? "oklch(0.681 0.162 75.8)"
        : "oklch(0.577 0.245 27.9)";

  return (
    <div
      style={{
        border: "1px solid oklch(0.871 0.006 286.3)",
        borderRadius: 8,
        padding: 24,
        maxWidth: 480,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{title}</h2>
        <span
          style={{
            background: difficultyColor,
            color: "#fff",
            padding: "2px 10px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {difficulty}
        </span>
      </div>

      <p style={{ margin: "0 0 16px", color: "oklch(0.373 0.034 259.7)", fontSize: 14 }}>
        {description}
      </p>

      <div
        style={{
          borderTop: "1px solid oklch(0.871 0.006 286.3)",
          paddingTop: 12,
        }}
      >
        <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600 }}>
          Checklist
        </h3>
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {checklist.map((item, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
                fontSize: 13,
                color: item.completed
                  ? "oklch(0.373 0.034 259.7)"
                  : "oklch(0.552 0.016 285.9)",
              }}
            >
              <input
                type="checkbox"
                checked={item.completed}
                readOnly
                style={{ accentColor: difficultyColor }}
              />
              <span
                style={{
                  textDecoration: item.completed ? "line-through" : "none",
                }}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const meta = {
  title: "Example/Checklist",
  component: HackathonCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof HackathonCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Document Anomaly Detection",
    description:
      "Build a real-time system that detects tampered land records, legal documents, and financial statements.",
    difficulty: "intermediate",
    checklist: [
      { label: "Set up document ingestion pipeline", completed: true },
      { label: "Implement OCR field extraction", completed: true },
      { label: "Build tamper detection engine", completed: false },
      { label: "Create risk scoring algorithm", completed: false },
      { label: "Design investigation dashboard", completed: false },
      { label: "Write end-to-end tests", completed: false },
    ],
  },
};
