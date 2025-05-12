import React from "react";
import { Element } from "react-scroll";
import { links } from "../constants";
import { Marker } from "../components/Marker.jsx";
import ContactForm from "./ContactForm.jsx";

const Contact = () => {
  return (
    <section>
      <Element
        name="contact"
        className="relative pt-24 pb-32 g7 max-lg:pb-24 max-md:py-16"
      >
        <div className="container">
          <div className="grid items-center grid-cols-1 md:grid-cols-2">
            <div className="mb-10 ">
              <div className="download_preview-before download_preview-after rounded-40 relative w-[755px] border-2 border-s5 p-6 z-10">
                <div className="relative px-6 pb-6 rounded-3xl bg-s1 pt-14">
                  <span className="download_preview-dot left-6 bg-p2" />
                  <span className="download_preview-dot left-11 bg-s3" />
                  <span className="download_preview-dot left-16 bg-p1/15" />

                  <img
                    src="/images/den2.png"
                    width={755}
                    height={555}
                    alt="screen"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="z-20">
              <ContactForm />
            </div>
          </div>
        </div>
      </Element>
    </section>
  );
};

export default Contact;
