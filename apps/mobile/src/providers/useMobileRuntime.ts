import { useContext } from "react";

import { MobileRuntimeContext } from "./MobileRuntimeContext";

export function useMobileRuntime() {
  return useContext(MobileRuntimeContext);
}
