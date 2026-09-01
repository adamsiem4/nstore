// ponytail: products inline — move to a DB query when there's a DB
const products = [
  { id: "n1", name: "Aero Hoodie", price: 68 },
  { id: "n2", name: "Canvas Tote", price: 24 },
  { id: "n3", name: "Merino Beanie", price: 32 },
  { id: "n4", name: "Field Jacket", price: 140 },
  { id: "n5", name: "Runner Socks", price: 12 },
  { id: "n6", name: "Leather Belt", price: 45 },
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function Home() {
  return (
    <div className="flex flex-1 flex-col font-sans text-zinc-900">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">nstore</span>
        <nav className="flex items-center gap-6 text-sm text-zinc-600">
          <a href="#shop" className="hover:text-zinc-900">
            Shop
          </a>
          <a href="#" className="hover:text-zinc-900">
            About
          </a>
          <a
            href="#"
            className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
          >
            Cart (0)
          </a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 pb-20">
        <section className="rounded-[2.5rem] bg-zinc-100 px-8 py-20 text-center sm:px-16 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            New season
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
            Everyday things, made well.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600">
            A small catalog of durable basics. Free shipping over $75, returns
            for 30 days.
          </p>
          <a
            href="#shop"
            className="mt-10 inline-flex h-12 items-center rounded-full bg-zinc-900 px-8 text-base font-medium text-white hover:bg-zinc-700"
          >
            Shop the collection
          </a>
        </section>

        <section id="shop" className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">Featured</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li
                key={p.id}
                className="rounded-3xl border border-zinc-200 p-6 transition-colors hover:border-zinc-400"
              >
                {/* ponytail: no image slot yet — placeholder block keeps the grid honest */}
                <div className="aspect-4/3 rounded-2xl bg-zinc-100" />
                <h3 className="mt-5 font-medium">{p.name}</h3>
                <p className="mt-1 text-zinc-600">{money.format(p.price)}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mt-auto border-t border-zinc-200 py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} nstore
      </footer>
    </div>
  );
}
