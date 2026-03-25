import { MobileRuntimeContext, type MobileRuntimeValue } from "./MobileRuntimeContext";

export function MobileRuntimeProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: MobileRuntimeValue;
}) {
  return (
    <MobileRuntimeContext.Provider value={value}>
      {children}
    </MobileRuntimeContext.Provider>
  );
}
