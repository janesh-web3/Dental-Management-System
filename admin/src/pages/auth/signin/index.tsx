import UserAuthForm from "./components/user-auth-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function SignInPage() {
  return (
    <div className="relative flex-col items-center justify-center h-screen md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        to="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute right-4 top-4 hidden md:right-8 md:top-8"
        )}
      >
        Login
      </Link>
      <div className="relative flex-col hidden h-full p-10 text-white bg-muted dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary dark:bg-secondary" />
        <div className="relative z-20 flex items-center text-lg font-medium ">
            <img src="crown.jpg" alt="logo" className="h-20 w-20 rounded-full"/>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This is dental clinic management system&rdquo;
            </p>
            <footer className="text-sm">- Crown Mantra AGI</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex items-center h-full p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Login to your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your phone number and password below to login your account
            </p>
          </div>
          <UserAuthForm />
          <p className="px-8 text-sm text-center text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link
              to="/"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
