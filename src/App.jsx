import { useState, useCallback } from "react";
import MathlyLanding from "./MathlyLanding.jsx";
import MathlyBuilder from "./MathlyBuilder.jsx";
import { skillById } from "./generators.js";

// The landing gallery renders its own illustrative sample problems and
// doesn't share ids with generators.js, so map each card to the closest
// real skill when the user opens it.
const TEMPLATE_TO_SKILL = {
  "times-tables": "mult-2x1",
  "fractions-like": "frac-add-like",
  "long-division": "long-division",
  "word-multiply": "word-onestep",
  "rectangle-area": "rect-area",
  rounding: "round-multidigit",
};

export default function App() {
  const [view, setView] = useState("landing");
  const [builderProps, setBuilderProps] = useState({});

  const openTemplate = useCallback((template) => {
    const skill = skillById(TEMPLATE_TO_SKILL[template.id]);
    setBuilderProps({
      initialGrade: skill ? skill.grade : template.grade,
      initialSkillIds: skill ? [skill.id] : [],
    });
    setView("builder");
  }, []);

  const openBlank = useCallback(() => {
    setBuilderProps({});
    setView("builder");
  }, []);

  const backToLanding = useCallback(() => setView("landing"), []);

  return view === "builder" ? (
    <MathlyBuilder {...builderProps} onBack={backToLanding} />
  ) : (
    <MathlyLanding onOpenTemplate={openTemplate} onBuildCustom={openBlank} />
  );
}
