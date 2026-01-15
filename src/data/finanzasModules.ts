// Enciclopedia Repaart 2.0 - Módulos de Finanzas
import { EncyclopediaModule } from './encyclopediaModules';

// CATEGORÍA: FINANZAS (Módulos 11-30)
export const finanzasModules: EncyclopediaModule[] = [
    {
        id: "fin-001",
        title: "El Valle de la Muerte (Tesorería de Arranque)",
        category: "Finanzas",
        content: "**El momento más peligroso no es cuando abres, sino el MES 1.**\n\n**El Desfase Cobro/Pago:**\n- Tus GASTOS empiezan el Día 1 (nóminas, gasolina, renting)\n- Tu primer INGRESO real puede tardar 20-25 días\n\n**El Cálculo Mortal:**\nSi facturas quincenal + 5 días de cobro = 20 días sin ingresos\nPero pagas nóminas el día 30 del mes anterior\n\n**Protocolo de Supervivencia:**\nFondo de Maniobra recomendado: 1.100€ - 2.000€\n⚠️ NO toques este dinero para 'caprichos' (muebles, cenas)\nEstá reservado EXCLUSIVAMENTE para pagar la primera nómina si hay retrasos.",
        action: "Abre una subcuenta bancaria 'INTOCABLE' y deposita allí el fondo de maniobra. Olvida que existe hasta una emergencia real.",
        example: "Franquicia Salamanca usó su fondo de maniobra para 'invertir en marketing'. Al llegar la nómina del mes 1, no tenía efectivo. Cerró en el mes 2.",
        order: 11
    },
    {
        id: "fin-002",
        title: "Disciplina Fiscal (La Trampa del IRPF)",
        category: "Finanzas",
        content: "**Muchos confunden 'dinero en banco' con 'beneficio'.**\n\n**El Modelo 130 (IRPF Trimestral):**\nComo autónomo/franquiciado, adelantas 20% de tu beneficio a Hacienda cada trimestre.\n\n**REGLA DE ORO:**\nDe cada 1.000€ que te queden 'limpios':\n- Separa 200€ INMEDIATAMENTE en subcuenta 'IMPUESTOS'\n- El resto es tu beneficio real\n\n**El IVA NO ES TUYO:**\nEl 21% que cobras en facturas eres un mero recaudador. No lo cuentes NUNCA como ingreso operativo.\n\n**Calendario Fiscal:**\n- Modelo 130 (IRPF): 20 abril, julio, octubre, enero\n- Modelo 303 (IVA): Mismas fechas\n- Modelo 390 (Resumen IVA): Enero",
        action: "Configura transferencia automática del 25% de cada cobro a cuenta 'HACIENDA'. Así nunca tendrás sorpresas trimestrales.",
        example: "Gerente ganó 4.000€ netos en Q1, se lo gastó todo. En abril llegó Hacienda pidiendo 800€. Tuvo que pedir préstamo personal.",
        order: 12
    },
    {
        id: "fin-003",
        title: "Facturación Quincenal (Protocolo de Cobro)",
        category: "Finanzas",
        content: "**El principal riesgo del sector es la tensión de caja.**\n\n**Protocolo de Seguridad Financiera:**\n\n1. **Facturación Quincenal:** Reducimos ciclo de cobro a 15 días para asegurar liquidez para nóminas\n\n2. **Cobro en 5 Días:** Contrato estipula pago obligatorio 5 días tras emisión de factura\n\n3. **Sistema Kill-Switch:** Corte automático e inmediato del servicio ante cualquier impago\n\n**RECUERDA:** No eres un banco. No financias clientes.\n\n**Gestión de Morosos:**\n- Día 6: Llamada de cortesía\n- Día 10: Email formal con copia a contabilidad\n- Día 15: Burofax + Corte de servicio\n- Día 30: Reclamación judicial si supera 500€",
        action: "Programa alertas automáticas en tu calendario: Día 1 (emitir factura), Día 6 (verificar pago), Día 7 (llamar si no hay pago).",
        example: "Restaurante 'El Asador' se retrasó 3 semanas. Sin Kill-Switch, acumuló 1.800€ de deuda. Con Kill-Switch activo, máximo riesgo es 300€.",
        order: 13
    },
    {
        id: "fin-004",
        title: "Ratios de Supervivencia Financiera",
        category: "Finanzas",
        content: "**Para gestionar como un CFO, monitoriza estos ratios trimestralmente:**\n\n**1. Ratio de Días de Caja:**\n¿Cuántos días aguantas sin ingresos?\nFórmula: Saldo Banco / (Gastos Mensuales / 30)\nMínimo saludable: 15 días\n\n**2. Ratio de Ventas por Empleado:**\nMide eficiencia real de plantilla\nSi baja: Te sobra gente o te faltan pedidos\n\n**3. Ratio de Plazo de Cobro:**\nVigila que restaurantes no se retrasen\nMáximo aceptable: 5-7 días\n\n**4. Ratio de Coste Laboral:**\nCoste Personal / Ventas Totales\n⚠️ Si supera 50-55%, estás muerto\nObjetivo: 40-45%",
        action: "Crea una hoja Excel con estos 4 ratios. Actualízala el día 1 de cada mes. Si alguno está en rojo, actúa esa semana.",
        example: "Franquicia detectó ratio coste laboral al 58%. Recortó 15 horas semanales no productivas y bajó al 47% en un mes.",
        order: 14
    },
    {
        id: "fin-005",
        title: "Gastos Controlables vs No Controlables",
        category: "Finanzas",
        content: "**Para sanear cuentas, distingue dónde meter la tijera.**\n\n**GASTOS CONTROLABLES (Tu Campo de Acción):**\n- Mantenimiento: Reparaciones por mal uso (formar rider ahorra dinero)\n- Servicios Externos: Gestoría, limpieza\n- Uniformes: Controlar inventario evita reposiciones\n- Suministros: Material oficina, limpieza\n- Combustible: Técnicas eco-conducción\n- Horas extras: Optimizar cuadrantes\n\n**GASTOS NO CONTROLABLES (Estructurales):**\n- Royalties: Fijos por contrato (1% o 3%)\n- Tasas y Tributos: Impuestos municipales, IRPF\n- Comisiones Bancarias: Datáfonos, tarjetas\n- Alquileres: Si tienes local físico\n- Seguros: Obligatorios por ley",
        action: "Céntrate en reducir los Controlables. Un ahorro del 10% en mantenimiento va directo a tu bolsillo. Intentar bajar los No Controlables es pérdida de tiempo.",
        example: "Gerente formó a riders en eco-conducción. Consumo de gasolina bajó 12%. Ahorro mensual: 45€ directos al margen.",
        order: 15
    },
    {
        id: "fin-006",
        title: "Umbral de Rentabilidad por Rider",
        category: "Finanzas",
        content: "**El KPI más importante de tu operación.**\n\n**El Ratio de Supervivencia:**\nUn rider necesita hacer entre **2.2 y 2.5 pedidos/hora** para ser rentable.\n\n**El Cálculo:**\n- Coste hora rider: ~8-10€ (salario + SS)\n- Coste hora moto: ~3-4€ (renting + gasolina prorrateado)\n- Coste total por hora: ~12-14€\n- Ingreso medio pedido Zona A: 6€\n\n**Punto Equilibrio:** 14€ / 6€ = 2.3 pedidos/hora\n\n**Si tu media baja de 2 pedidos/hora:**\n- La zona es muy amplia (Zona C/D)\n- El restaurante es lento\n- El rider se pierde\n- Hay tiempos muertos no justificados",
        action: "Extrae de Flyder el ratio pedidos/hora por rider. Si alguien está por debajo de 2.0, investiga la causa esa misma semana.",
        example: "Rider con ratio 1.8 resultó estar haciendo descansos no autorizados de 20 min. Tras corrección, subió a 2.4.",
        order: 16
    },
    {
        id: "fin-007",
        title: "La Caja de Resistencia (Fondo Intocable)",
        category: "Finanzas",
        content: "**El Fondo de Maniobra Operativo (~1.100€) NO es beneficio.**\n\n**Es tu seguro de vida para:**\n- Avería simultánea de 2 motos\n- Retraso en pago de restaurante grande\n- Subida inesperada de gasolina\n- Multa o imprevisto administrativo\n- Baja laboral de rider clave\n\n**NIVEL DE ALERTA:**\nSi el saldo de tu cuenta operativa baja de 1.100€:\n⚠️ Estás en ALERTA ROJA\n\n**Protocolo de Emergencia:**\n1. Cortar cualquier gasto no esencial\n2. Pausar tu propio sueldo temporalmente\n3. Acelerar cobros pendientes\n4. Negociar aplazamiento con proveedores",
        action: "Programa alerta bancaria automática cuando el saldo baje de 1.200€. No esperes a ver números rojos.",
        example: "Gerente mantuvo fondo intocable de 1.500€. Cuando 2 motos fallaron el mismo día, pudo cubrir las franquicias sin pedir préstamo.",
        order: 17
    },
    {
        id: "fin-008",
        title: "Calidad de la Deuda (Ratio Crítico)",
        category: "Finanzas",
        content: "**El peligro no es deber dinero, sino CÓMO lo debes.**\n\n**El Concepto de Calidad de Deuda:**\nMide qué proporción de tu deuda es a Corto Plazo (vence ya) vs Largo Plazo (vence después).\n\n**ALERTA ROJA:**\nSi la mayor parte de tu deuda es a corto plazo = Baja calidad de deuda.\n\n**El Riesgo:**\nUn solo mes malo de ventas puede provocar insolvencia porque no puedes pagar lo que vence.\n\n**Acción Correctiva:**\nSi este ratio se dispara, negocia con el banco para reestructurar la deuda a largo plazo y 'comprar tiempo'.\n\n**Deuda Buena vs Mala:**\n- Buena: Préstamo a 5 años para motos (inversión productiva)\n- Mala: Tarjeta de crédito para pagar nóminas (emergencia crónica)",
        action: "Lista todas tus deudas: importe + fecha vencimiento. Si más del 60% vence en menos de 6 meses, necesitas reestructurar.",
        example: "Franquicia tenía 4.000€ de deuda, 80% a corto plazo. Refinanció a 24 meses y su flujo de caja mejoró 400€/mes.",
        order: 18
    },
    {
        id: "fin-009",
        title: "Protocolo Turnaround (Rescate)",
        category: "Finanzas",
        content: "**¿Qué hacer si llevas 2 meses perdiendo dinero? No esperes al tercero.**\n\n**PASO 1: Auditoría de Coste Laboral**\nSi tu coste de personal supera el 50-55% de ventas, estás muerto.\nAcción: Recorta horas no productivas INMEDIATAMENTE, aunque duela.\n\n**PASO 2: Purga de Clientes**\nIdentifica el 20% de restaurantes que te dan menos margen:\n- Pedidos lejos (Zona C/D)\n- Mucha espera en cocina\n- Bajo volumen\nAcción: Sube su tarifa 1€ o rescinde contrato.\n\n**PASO 3: Llamada a Central**\nAntes de cerrar, pide ayuda. La Central puede ofrecerte:\n- Reubicación de zona\n- Plan de viabilidad específico\n- Mentoring intensivo temporal",
        action: "Si tu margen neto baja del 10% dos meses seguidos, activa protocolo de turnaround inmediatamente. No esperes.",
        example: "Franquicia Ávila rescindió 3 clientes lejanos y recortó 20h semanales. Pasó de -300€/mes a +450€/mes en 5 semanas.",
        order: 19
    },
    {
        id: "fin-010",
        title: "La Fórmula del Beneficio (Las 2 Palancas)",
        category: "Finanzas",
        content: "**A veces nos perdemos en detalles y olvidamos lo básico.**\n\n**Ante un mal mes, solo tienes 2 botones que pulsar:**\n\n**PALANCA 1: Aumentar Flujo de Entrada (Ventas)**\n- Captar nuevos restaurantes\n- Renegociar tarifas (subir precios en zonas lejanas)\n- Aumentar pedidos por cliente existente\n\n**PALANCA 2: Disminuir Flujo de Salida (Costes)**\n- Controlar coste de personal (horas muertas)\n- Reducir desperdicio (pedidos fallidos)\n- Optimizar inventario (material perdido)\n- Eco-conducción (combustible)\n\n**ESTRATEGIA PRIORIZADA:**\nAntes de intentar vender más (requiere esfuerzo comercial), revisa primero el 'desagüe' de costes. El impacto en el beneficio es INMEDIATO.",
        action: "Esta semana, antes de visitar nuevos clientes, dedica 2 horas a analizar dónde estás perdiendo dinero internamente.",
        example: "Gerente descubrió que gastaba 150€/mes en material de oficina innecesario. Recorte inmediato = 150€ más de beneficio.",
        order: 20
    }
];

export const getFinanzasModules = () => finanzasModules;
