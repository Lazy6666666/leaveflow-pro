type RouteFallbackProps = {
  fullScreen?: boolean;
};

const RouteFallback = ({ fullScreen }: RouteFallbackProps) => {
  return <div className={(fullScreen ? "min-h-screen " : "py-16 ") + "bg-background"} />;
};

export default RouteFallback;
