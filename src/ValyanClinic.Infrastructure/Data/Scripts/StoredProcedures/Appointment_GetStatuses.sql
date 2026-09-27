SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_GetStatuses
-- Descriere: Nomenclator statusuri programări (global) + codurile în care se
--            poate tranziționa din fiecare status (pentru gating în UI)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_GetStatuses
AS
BEGIN
    SET NOCOUNT ON;

    SELECT s.Id, s.Name, s.Code, s.SortOrder, s.BlocksSlot,
           (SELECT STRING_AGG(t.Code, ',') WITHIN GROUP (ORDER BY t.SortOrder)
              FROM dbo.AppointmentStatusTransitions tr
              INNER JOIN dbo.AppointmentStatuses t ON t.Id = tr.ToStatusId
             WHERE tr.FromStatusId = s.Id AND t.IsActive = 1) AS AllowedNextCodes
    FROM dbo.AppointmentStatuses s
    WHERE s.IsActive = 1
    ORDER BY s.SortOrder;
END;
GO
