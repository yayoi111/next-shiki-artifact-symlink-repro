import { codeToHtml } from "shiki";

export const dynamic = "force-dynamic";

export default async function Page() {
  const highlighted = await codeToHtml("export const answer = 42;", {
    lang: "ts",
    theme: "github-dark",
  });

  return (
    <main>
      <h1>Turbopack external alias repro</h1>
      <section>
        <h2>Direct shiki server render</h2>
        <div dangerouslySetInnerHTML={{ __html: highlighted }} />
      </section>
    </main>
  );
}
