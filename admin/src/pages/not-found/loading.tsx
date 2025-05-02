export default function Loading() {
  return (
    <div className="absolute items-center justify-center mb-16 text-center -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
      <span className="bg-gradient-to-b from-foreground to-transparent bg-clip-text text-[3rem] md:text-[5rem] font-extrabold leading-none text-transparent">
        Loading...
      </span>
    </div>
  );
}
