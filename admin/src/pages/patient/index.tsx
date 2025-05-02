import PageHead from "@/components/shared/page-head";
import { PatientTable } from "./Table";

const Patient = () => {
  return (
    <div>
      <PageHead title="Patient Management" />

      <div className="flex justify-center w-auto h-auto mx-auto overflow-auto">
        <PatientTable />
      </div>
    </div>
  );
};

export default Patient;
