import { Element, Link as LinkScroll } from "react-scroll";
import Button from "../components/Button.jsx";

const Hero = () => {
  return (
    <section className="relative pt-40 pb-40 max-lg:pt-52 max-lg:pb-36 max-md:pt-36 max-md:pb-32">
      <Element name="hero">
        <div className="container grid grid-cols-1 md:grid-cols-2">
          <div className="relative z-2 max-w-512 max-lg:max-w-388">
            <div className="uppercase caption small-2 text-p3">
              Empower Your Dental Clinic with Smarter Management
            </div>
            <h1 className="mb-6 uppercase h1 text-p4 max-lg:mb-7 max-lg:h2 max-md:mb-4 max-md:text-3xl">
              Amazingly simple
            </h1>
            <p className="mb-10 max-w-440 body-1 max-md:mb-10">
              With DEN<span className="text-yellow-500">TAL</span>, seamlessly
              manage patients, doctors, billing, appointments, and more—all in
              one intuitive platform.
            </p>
            <LinkScroll to="contact" offset={-100} spy smooth>
              <Button icon="/images/zap.svg">Contact Now</Button>
            </LinkScroll>
          </div>

          <div className="mb-10 max-md:hidden">
            <div className="download_preview-before download_preview-after rounded-40 relative w-[955px] border-2 border-s5 p-4">
              <div className="relative px-2 pb-4 rounded-3xl bg-s1 pt-14">
                <span className="download_preview-dot left-6 bg-p2" />
                <span className="download_preview-dot left-11 bg-s3" />
                <span className="download_preview-dot left-16 bg-p1/15" />

                <img
                  src="/images/den1.png"
                  width={955}
                  height={755}
                  alt="screen"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </Element>
    </section>
  );
};

export default Hero;
