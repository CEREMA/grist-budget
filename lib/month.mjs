function createDate(str, low=false, high=false) {
  if (str.length == 4) {
    return new Date(parseInt(str), 1, 1)
  }
  if (str.length == 7) {
    const parts = str.split("-")
    return new Date(parseInt(parts[0]), parseInt(parts[1]), 1)
  }
  if (low) {
    return new Date(1900, 1, 1)
  }
  if (high) {
    return new Date(2100, 1, 1)
  }
}

function generateFilter(filterOptions) {
  console.log("filtre", filterOptions)
  if (!filterOptions) {
    return () => true
  }
  const parts = filterOptions.split(":")
  if (parts.length != 2) {
    throw "Oupsy"
  }
  const gte = createDate(parts[0], low=true)
  const lte = createDate(parts[1], high=true)
  console.log("filtre", gte, lte)
  return (v) => {
    return (v >= gte) && (v < lte);
  }
}

export function filterMonths(months, filter) {
  const filterFct = generateFilter(filter);

  return months.filter(filterFct);
}
