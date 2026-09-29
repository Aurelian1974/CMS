-- ============================================================================
-- Migrare 0065: Fluxul programare ↔ consultație
-- Descriere: FINALIZAT se atinge doar prin finalizarea consultației
--            (Consultation_Finalize), nu manual → se elimină tranzițiile către el;
--            statusul se afișează „Consultație finalizată".
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DELETE tr
  FROM dbo.AppointmentStatusTransitions tr
 INNER JOIN dbo.AppointmentStatuses s ON s.Id = tr.ToStatusId
 WHERE s.Code = 'FINALIZAT';
GO

UPDATE dbo.AppointmentStatuses
   SET Name = N'Consultație finalizată'
 WHERE Code = 'FINALIZAT' AND Name <> N'Consultație finalizată';
GO
