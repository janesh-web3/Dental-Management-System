import { useRouter } from "@/routes/hooks";
import { Button } from "@/components/ui/button";

export default function Error() {
  const router = useRouter();

  return (
    <div className="absolute items-center justify-center mb-16 text-center -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
      <span className="bg-gradient-to-b from-foreground to-transparent bg-clip-text text-[3rem] md:text-[5rem] font-extrabold leading-none text-transparent">
        Error
      </span>
      <h2 className="my-2 text-2xl font-bold font-heading">
        Something&apos;s missing
      </h2>
      <p>Please, connect to the internet and try again</p>
      <div className="flex justify-center gap-2 mt-8">
        <Button onClick={() => router.back()} variant="default" size="lg">
          Go back
        </Button>
        <Button onClick={() => router.reload()} variant="ghost" size="lg">
          Reload
        </Button>
      </div>
    </div>
  );
}
