(
  SELECT
    c.Reason_Code,
    c.Reason_Description,
    p.Reason_Code_ProcessIdent,
    p.Reason_Project,
    p.Reason_Process_EN
  FROM
    [SKU_Master].[dbo].[Reason_Code] c
    LEFT JOIN [SKU_Master].[dbo].[Reason_Code_Process] p ON SUBSTRING(
      c.Reason_Code,
      PATINDEX('%[^0-9]%', SUBSTRING(c.Reason_Code, 3, 10)) + 2,
      2
    ) = p.Reason_Code_ProcessIdent
  WHERE
    c.Reason_Code LIKE 'SA%'
    AND PATINDEX('%[^0-9]%', SUBSTRING(c.Reason_Code, 3, 10)) > 2
);