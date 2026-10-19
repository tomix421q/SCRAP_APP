(
  SELECT
    [Material],
    [Description],
    [P_L] AS [P_L],
    [Product] AS PartGroup,
    [FR_RR] + [Side] AS Side,
    [OEM] AS Customer,
    [ProdHall] AS Hall,
    [SAFGroup] AS Project
  FROM
    SKU_Master.dbo.SKU parts
);