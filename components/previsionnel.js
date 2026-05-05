/*
Ce composant est celui avec le plus de potentiel (mais aussi la plus complexe)
Il s'agit de générer la vue de prévisionnel naturelle pour les personnes avec
* les personnes en lignes
* les mois en colonnes

à la place d'une longue liste de consommations mensuelles.

Cette vue là peut-être considéréé comme une pivot table de la liste des conso.

*/
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HotTable } from "@handsontable/react-wrapper";
import { registerAllModules } from "handsontable/registry";

import { filterMonths } from "../lib/month.mjs";

registerAllModules();

function formatMonthHeader(m) {
  const c = new Date(parseInt(m)*1000)
  return c.toISOString().slice(0, 7)
}

const COL_MOIS = ""
const COL_TOTAL = "Cout_TTC"
const COL_NB_JOURS = "Nb_jours_numerique"

export default function PreviewComponent(props) {
  const hotRef = useRef(null);
  const searchParams = useSearchParams();
  const period = searchParams.get("period");

  const [allMonths, setAllMonths] = useState();
  const [months, setMonths] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [log, setLog] = useState("");

  useEffect(() => {
    if (!props?.data?.rows?.records?.length) {
      setRowData([]);
      setMonths([]);
      return;
    }

    props.data.cellMap = {}
    props.data.cells.id.forEach((v,i) => {
      props.data.cellMap[v] = i
    })

    const monthSet = new Set()
    const dataByNames = {};
    props.data.rows.records.forEach((r) => {
      const personKey = r.Nom_interne;
      dataByNames[personKey] = dataByNames[personKey] || {
        Personne: personKey,
        values: {},
      };

      const cellIds = r[props.data.rows.cellColumn]
      cellIds?.forEach(id => {
        const idx = props.data.cellMap[id]
        const period = props.data.cells.Periode[idx]
        monthSet.add(period)

        dataByNames[personKey].values[period] =
          dataByNames[personKey].values[period] || [];
        dataByNames[personKey].values[period].push(idx);
      })

    });
    const names = Object.keys(dataByNames);
    names.sort();

    setRowData(names.map((n) => dataByNames[n]));
    const mmonths = Array.from(monthSet);
    mmonths.sort()
    setMonths(mmonths);
  }, [props.data]);

  const accSum = (a, v) => a + (v || 0);
  const amountDisplay = (v) =>
    v.toLocaleString("FR-fr", { style: "currency", currency: "EUR" });

  const buildTableData = useCallback(() => {
    const data = rowData.map((person) => {
      return [
        person.Personne,
        ...months.map((m, i) => {
          return person.values[m]
            ?.map((idx) => props.data.cells[COL_NB_JOURS][idx])
            .reduce(accSum, 0);
        }),
      ];
    });

    data.forEach((r, i) => {
      r.push("");
      const v = months
        .map((m) => {
          const person = rowData[i];
          return person.values[m]
            ?.map((idx) => props.data.cells[COL_TOTAL][idx])
            .reduce(accSum, 0);
        })
        .reduce(accSum, 0);
      r.push(amountDisplay(v));
    });

    const sumData = months.map((m) => {
      const total = rowData
        .map((r) => {
          return r.values[m]
            ?.map((idx) => props.data.cells[COL_TOTAL][idx])
            .reduce(accSum, 0);
        })
        .reduce(accSum, 0);
      return total;
    });

    const fullSum = sumData.reduce(accSum, 0);
    sumData.push("");
    sumData.push(fullSum);

    setTableData([...data, [], ["Total", ...sumData.map(amountDisplay)]]);
  }, [rowData]);

  useEffect(() => {
    buildTableData();
  }, [months, rowData]);

  const getCellData = useCallback(
    (row, column) => {
      const details = rowData[row];
      return details?.values?.[months[column - 1]];
    },
    [rowData, months],
  );

  function afterSelectionEnd(row, column) {
    if (row < 0) {
      return;
    }
    const input = getCellData(row, column);
    props?.afterSelectionEnd?.(input);
  }

  function download() {
    var link = document.createElement("a");
    link.download = "sample.json";
    const b = new Blob([JSON.stringify(props.data, null, 2)]);
    link.href = URL.createObjectURL(b);
    link.click();
  }

  return (
    <>
      <HotTable
        ref={hotRef}
        data={tableData}
        rowHeaders={false}
        fixedColumnsStart={1}
        colHeaders={[
          "Intervention prévue",
          ...(months.map(formatMonthHeader) || []),
          "",
          "Total",
        ]}
        columns={[
          {
            type: "text",
            readOnly: true,
          },
          ...[...months, ...["", "Total"]].map(() => {
            return {
              type: "numeric",
              className: "htRight",
            };
          }),
        ]}
        height="auto"
        licenseKey="non-commercial-and-evaluation"
        afterSelectionEnd={afterSelectionEnd}
        copyPaste={true}
        cells={(row, column) => {
          const cellProperties = {};
          if (row >= rowData.length || column > 12) {
            cellProperties.readOnly = true;
          } else if (column > 0) {
            const input = getCellData(row, column);
            if (input) {
              const classNames = [];
              if (input.length > 1) {
                classNames.push("italic");
                cellProperties.readOnly = true;
              }
              if (
                input.filter((c) => c.Statut === "Consommé").length ===
                input.length
              ) {
                classNames.push("bold");
                cellProperties.readOnly = true;
              }
              cellProperties.className = classNames.join(" ");
            }
          }
          return cellProperties;
        }}
      />
      <div>
        <p>
          Les nombres de jours en <i>italique</i> sont calculés en sommant
          plusieurs consommations mensuelles. Pour cette raison, ils ne sont pas
          modifiables.
        </p>
        <p>
          Les nombres de jours en <b>gras</b> sont indiqués comme « Réalisé ».
          Pour cette raison, ils ne sont pas modifiables.
        </p>
        <button onClick={download}>download</button>
      </div>
    </>
  );
}
