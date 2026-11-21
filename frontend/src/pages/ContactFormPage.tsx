import { useNavigate, useParams } from 'react-router-dom';
import { useAddContact, useContact, useUpdateContact } from '../api/contacts';
import { useVolunteers } from '../api/volunteers';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TopBar } from '../components/TopBar';
import { ContactForm, EMPTY_CONTACT } from '../components/ContactForm';
import { ProfileSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import type { Contact, ContactInput } from '../types';

const VOLUNTEER_FIELDS = [
  'chantingRounds',
  'booksReading',
  'sundayServiceCount',
  'tripsAttended',
  'eventsAttended',
  'weekdaySessionsAttended',
  'notes',
] as const;

function toInput(c: Contact): ContactInput {
  return {
    name: c.name,
    phone: c.phone,
    area: c.area,
    pgName: c.pgName,
    firstContactDate: c.firstContactDate,
    chantingRounds: c.chantingRounds,
    booksReading: c.booksReading,
    sundayServiceCount: c.sundayServiceCount,
    tripsAttended: c.tripsAttended,
    eventsAttended: c.eventsAttended,
    weekdaySessionsAttended: c.weekdaySessionsAttended,
    assignedTo: c.assignedTo,
    notes: c.notes,
  };
}

/** Same form for "Add" (admin) and "Edit" (admin: all fields; volunteer: sadhana/attendance/notes). */
export default function ContactFormPage({ mode }: { mode: 'new' | 'edit' }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: volunteers = [] } = useVolunteers(isAdmin);
  const contactQuery = useContact(mode === 'edit' ? id : '');
  const add = useAddContact();
  const update = useUpdateContact();

  if (mode === 'new') {
    return (
      <div>
        <TopBar back="/" title="New contact" />
        <ContactForm
          defaultValues={EMPTY_CONTACT}
          isAdmin
          volunteers={volunteers}
          submitting={add.isPending}
          submitLabel="Add contact"
          allowPristine
          onSubmit={(values) => add.mutate(values, { onSuccess: (c) => navigate(`/contact/${c.id}`, { replace: true }) })}
        />
      </div>
    );
  }

  const contact = contactQuery.data;
  // Wait for the full record (not the list placeholder) so the form starts from fresh data.
  const ready = contact && !contactQuery.isPlaceholderData;

  return (
    <div>
      <TopBar back title={isAdmin ? 'Edit contact' : 'Update progress'} subtitle={contact?.name} />
      {contactQuery.isError && !contact ? (
        <ErrorState message={errorMessage(contactQuery.error)} onRetry={() => contactQuery.refetch()} />
      ) : !ready ? (
        <ProfileSkeleton />
      ) : (
        <ContactForm
          key={contact.updatedAt}
          defaultValues={toInput(contact)}
          isAdmin={isAdmin}
          volunteers={volunteers}
          submitting={update.isPending}
          submitLabel="Save changes"
          onSubmit={(values) => {
            const payload = isAdmin
              ? values
              : Object.fromEntries(VOLUNTEER_FIELDS.map((k) => [k, values[k]]));
            update.mutate(
              { id: contact.id, ...payload },
              {
                onSuccess: () =>
                  (window.history.state as { idx?: number } | null)?.idx
                    ? navigate(-1)
                    : navigate(`/contact/${contact.id}`, { replace: true }),
              },
            );
          }}
        />
      )}
    </div>
  );
}
