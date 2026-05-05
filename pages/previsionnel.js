import { useCallback, useEffect, useRef, useState } from "react";
import PreviewComponent from "../components/previsionnel.js";

export default function PreviewPage() {
  const [input, setInput] = useState();

  function afterSelectionEnd(input) {
    const rowId = input?.length === 1 ? input[0].id : "new";
    window.grist.setCursorPos({ rowId });
  }

  useEffect(() => {
    window.grist.ready({
      allowSelectBy: true,
      requiredAccess: "read table",
    });
    window.grist.onRecords(async (records) => {
      const cellColumn = "Consommations"
      const tableId = await window.grist.getTable().getTableId()

      const tokenInfo = await grist.docApi.getAccessToken({ readOnly: true });
      const columnsUrl = `${tokenInfo.baseUrl}/tables/${tableId}/columns?hidden=true?auth=${tokenInfo.token}`;
      const columnsResponse = await fetch(columnsUrl);
      const {columns} = await columnsResponse.json();

      const cellColumnMeta = columns.find(v => v.id == cellColumn)
      const cellTable = cellColumnMeta.fields.type.split(":")[1]
      const cells = await grist.docApi.fetchTable(cellTable)
      //const cellsUrl = `${tokenInfo.baseUrl}/tables/${cellTable}/records?auth=${tokenInfo.token}`;
      //const cellsResponse = await fetch(cellsUrl);
      //const cells = await cellsResponse.json();

      const data = {rows: {records, columns, cellColumn}, cells}
      setInput(data);
    }, {
      expandRefs: false,
      includeColumns: "all",
    });
  }, []);

  return (
    <PreviewComponent data={input} afterSelectionEnd={afterSelectionEnd} />
  );
}
