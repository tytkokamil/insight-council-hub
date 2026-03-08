import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import InviteReviewerPrompt from "./InviteReviewerPrompt";

interface Props {
  decisionId: string;
  decisionTitle: string;
  costPerDay?: number | null;
  isFirstDecision: boolean;
}

/**
 * Shows an invite prompt after the user's first decision is created.
 * Only shows once (localStorage flag).
 */
const PostDecisionInvitePrompt = ({ decisionId, decisionTitle, costPerDay, isFirstDecision }: Props) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isFirstDecision && !localStorage.getItem("post-decision-invite-shown")) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isFirstDecision]);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("post-decision-invite-shown", "true");
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <InviteReviewerPrompt
        decisionId={decisionId}
        decisionTitle={decisionTitle}
        costPerDay={costPerDay}
        trigger="first_decision"
        onDismiss={handleDismiss}
        onInvited={handleDismiss}
      />
    </AnimatePresence>
  );
};

export default PostDecisionInvitePrompt;
