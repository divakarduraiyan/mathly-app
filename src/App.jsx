import { useState, useCallback, useEffect } from "react";
import MathlyLanding from "./MathlyLanding.jsx";
import MathlyBuilder from "./MathlyBuilder.jsx";
import { skillById } from "./generators.js";
import { trackLanding, trackOpenBuilder } from "./analytics.js";

export default function App() {
  const [view, setView] = useState("landing");
  const [builderProps, setBuilderProps] = useState({});

  useEffect(() => {
    if (view === "landing") trackLanding();
  }, [view]);

  const openTemplate = useCallback((template) => {
    const skill = skillById(template.skillId);
    const grade = skill ? skill.grade : template.grade;
    setBuilderProps({
      initialGrade: grade,
      initialSkillIds: skill ? [skill.id] : [],
    });
    setView("builder");
    trackOpenBuilder(grade);
  }, []);

  const openBlank = useCallback(() => {
    setBuilderProps({});
    setView("builder");
    trackOpenBuilder();
  }, []);

  const backToLanding = useCallback(() => setView("landing"), []);

  return view === "builder" ? (
    <MathlyBuilder {...builderProps} onBack={backToLanding} />
  ) : (
    <MathlyLanding onOpenTemplate={openTemplate} onBuildCustom={openBlank} />
  );
}
