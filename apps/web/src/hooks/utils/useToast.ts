import { useState, useEffect } from "react";

import { getState, subscribe, dispatch, toast } from "./toastStore";
import type { ToastState } from "./toastStore";

export { toast };
export { reducer } from "./toastStore";

function useToast() {
  const [state, setState] = useState<ToastState>(getState);

  useEffect(() => {
    return subscribe(setState);
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast };
