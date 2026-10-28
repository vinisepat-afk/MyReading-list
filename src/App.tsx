import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  BookMarked,
  BookCheck,
  Plus,
  Library,
  Trash2,
  Search,
} from 'lucide-react';

type Status = 'want' | 'reading' | 'finished';

interface Book {
  id: string;
  title: string;
  status: Status;
}

const STATUS_META: Record<
  Status,
  { label: string; icon: typeof BookOpen; accent: string; dot: string; badge: string }
> = {
  want: {
    label: 'Want to Read',
    icon: BookMarked,
    accent: 'text-amber-600',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  reading: {
    label: 'Reading',
    icon: BookOpen,
    accent: 'text-sky-600',
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  finished: {
    label: 'Finished',
    icon: BookCheck,
    accent: 'text-emerald-600',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
};

const FILTERS: { key: 'all' | Status; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'want', label: 'Want to Read' },
  { key: 'reading', label: 'Reading' },
  { key: 'finished', label: 'Finished' },
];

const STORAGE_KEY = 'reading-list:books';

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Book[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b) => b && typeof b.title === 'string' && ['want', 'reading', 'finished'].includes(b.status)
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [books, setBooks] = useState<Book[]>(loadBooks);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Status>('want');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const counts = useMemo(() => {
    return books.reduce<Record<'all' | Status, number>>(
      (acc, b) => {
        acc.all += 1;
        acc[b.status] += 1;
        return acc;
      },
      { all: 0, want: 0, reading: 0, finished: 0 }
    );
  }, [books]);

  const visibleBooks = useMemo(() => {
    return books
      .filter((b) => filter === 'all' || b.status === filter)
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [books, filter]);

  function addBook(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a book title.');
      return;
    }
    if (trimmed.length > 120) {
      setError('Title is too long (120 characters max).');
      return;
    }
    setError('');
    setBooks((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title: trimmed, status },
      ...prev,
    ]);
    setTitle('');
  }

  function changeStatus(id: string, next: Status) {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status: next } : b)));
  }

  function removeBook(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-white shadow-sm">
              <Library className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Reading List</h1>
              <p className="text-sm text-stone-500">Track the books you plan to read, are reading, and have finished.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Add book form */}
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">Add a book</h2>
          <form onSubmit={addBook} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Book title"
                aria-label="Book title"
                maxLength={120}
                className="flex-1 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
              />
              <div className="flex gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  aria-label="Reading status"
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
                >
                  <option value="want">Want to Read</option>
                  <option value="reading">Reading</option>
                  <option value="finished">Finished</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-700 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </section>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* List / Empty state */}
        <div className="mt-5">
          {books.length === 0 ? (
            <EmptyState />
          ) : visibleBooks.length === 0 ? (
            <NoMatches />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visibleBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onChangeStatus={changeStatus}
                  onRemove={removeBook}
                />
              ))}
            </ul>
          )}
        </div>
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <p className="text-center text-xs text-stone-400">Your reading list is saved only on this device.</p>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Library className="h-7 w-7" />
      </div>
      <p className="text-base font-medium text-stone-700">Your reading list is empty. Add your first book.</p>
      <p className="mt-1 text-sm text-stone-400">Use the form above to get started.</p>
    </div>
  );
}

function NoMatches() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Search className="h-7 w-7" />
      </div>
      <p className="text-base font-medium text-stone-700">No books in this category.</p>
      <p className="mt-1 text-sm text-stone-400">Try a different filter.</p>
    </div>
  );
}

interface BookCardProps {
  book: Book;
  onChangeStatus: (id: string, status: Status) => void;
  onRemove: (id: string) => void;
}

function BookCard({ book, onChangeStatus, onRemove }: BookCardProps) {
  const meta = STATUS_META[book.status];
  const Icon = meta.icon;
  return (
    <li className="group flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-50 ring-1 ring-stone-100 ${meta.accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium leading-snug text-stone-900 break-words">{book.title}</h3>
            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${meta.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>
        </div>
        <button
          onClick={() => onRemove(book.id)}
          aria-label={`Remove ${book.title}`}
          className="shrink-0 rounded-md p-1.5 text-stone-300 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(STATUS_META) as Status[]).map((s) => {
          const active = book.status === s;
          const m = STATUS_META[s];
          return (
            <button
              key={s}
              onClick={() => onChangeStatus(book.id, s)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                active
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-50 text-stone-500 ring-1 ring-stone-200 hover:bg-stone-100'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-white/70' : m.dot}`} />
              {m.label}
            </button>
          );
        })}
      </div>
    </li>
  );
}
