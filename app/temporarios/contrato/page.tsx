import {Suspense} from "react"
import ContractScreen from "./ContractScreen"
export default function ContractPage(){return <Suspense fallback={<p>Cargando contrato...</p>}><ContractScreen/></Suspense>}
