-- ============================================================================
-- Migrare 0066: Aliniază starea programărilor cu consultațiile existente
-- Descriere: consultațiile create/finalizate înainte de 0065 au lăsat programarea
--            în Programat. Finalizate/facturate/blocate → FINALIZAT;
--            în lucru pe o programare Programat → CONFIRMAT (regula din 0065).
--            Autorul auditului = ultimul care a modificat consultația.
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @Finalizat UNIQUEIDENTIFIER = (SELECT Id FROM dbo.AppointmentStatuses WHERE Code = 'FINALIZAT');
DECLARE @Confirmat UNIQUEIDENTIFIER = (SELECT Id FROM dbo.AppointmentStatuses WHERE Code = 'CONFIRMAT');
DECLARE @Programat UNIQUEIDENTIFIER = (SELECT Id FROM dbo.AppointmentStatuses WHERE Code = 'PROGRAMAT');

DECLARE @Changes TABLE (
    AppointmentId UNIQUEIDENTIFIER, ClinicId UNIQUEIDENTIFIER,
    OldStatusId UNIQUEIDENTIFIER, NewStatusId UNIQUEIDENTIFIER, ChangedBy UNIQUEIDENTIFIER);

INSERT INTO @Changes (AppointmentId, ClinicId, OldStatusId, NewStatusId, ChangedBy)
SELECT a.Id, a.ClinicId, a.StatusId,
       CASE WHEN cs.Code = 'INLUCRU' THEN @Confirmat ELSE @Finalizat END,
       ISNULL(c.UpdatedBy, c.CreatedBy)
FROM dbo.Appointments a
INNER JOIN dbo.Consultations c         ON c.AppointmentId = a.Id AND c.IsDeleted = 0
INNER JOIN dbo.ConsultationStatuses cs ON cs.Id = c.StatusId
WHERE a.IsDeleted = 0
  AND (   (cs.Code IN ('FINALIZATA', 'FACTURATA', 'BLOCATA') AND a.StatusId <> @Finalizat)
       OR (cs.Code = 'INLUCRU' AND a.StatusId = @Programat));

UPDATE a SET
    StatusId  = ch.NewStatusId,
    UpdatedAt = SYSDATETIME(),
    UpdatedBy = ch.ChangedBy
FROM dbo.Appointments a
INNER JOIN @Changes ch ON ch.AppointmentId = a.Id;

INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
SELECT ch.ClinicId, N'Appointment', ch.AppointmentId, N'UpdateStatus',
       (SELECT ch.OldStatusId AS StatusId FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
       (SELECT ch.NewStatusId AS StatusId, N'Migrare 0066' AS Source FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
       ch.ChangedBy
FROM @Changes ch;

DECLARE @Count INT = (SELECT COUNT(*) FROM @Changes);
PRINT CONCAT('Programari aliniate cu consultatiile: ', @Count);
GO
