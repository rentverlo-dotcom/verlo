// lib/contracts/generateContract.ts

type ContractData = {
  tenantName: string
  ownerName: string
  propertyAddress: string
  price: number
  deposit: number
  startDate: string
  endDate: string
  durationMonths: number
}

export function generateContractHTML(data: ContractData) {
  return `
    <h1 style="text-align:center;">CONTRATO DE LOCACIÓN DE VIVIENDA</h1>

    <p>
      Entre <strong>${data.ownerName}</strong> (LA LOCADORA)
      y <strong>${data.tenantName}</strong> (LA LOCATARIA)
      se celebra el presente contrato de locación.
    </p>

    <h2>Objeto</h2>
    <p>
      Inmueble ubicado en ${data.propertyAddress}.
    </p>

    <h2>Plazo</h2>
    <p>
      ${data.durationMonths} meses,
      desde ${data.startDate}
      hasta ${data.endDate}.
    </p>

    <h2>Precio</h2>
    <p>
      Canon mensual: $${data.price}
    </p>

    <h2>Depósito</h2>
    <p>
      $${data.deposit}
    </p>

    <hr/>

    <p>
      Las partes declaran aceptar todas las cláusulas del contrato
      conforme legislación vigente.
    </p>

    <br/><br/>

    <p>Firma propietario: _______________________</p>
    <p>Firma inquilino: _________________________</p>
  `
}
