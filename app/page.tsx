import { codeToHtml } from "shiki";
import { Streamdown } from "streamdown";
import { streamdownPlugins } from "./streamdown-plugins";

export const dynamic = "force-dynamic";

const markdown = [
  "# Turbopack external alias repro",
  "",
  "```ts",
  "export const answer = 42;",
  "```",
].join("\n");

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
      <section>
        <h2>streamdown code plugin</h2>
        <Streamdown plugins={streamdownPlugins}>{markdown}</Streamdown>
      </section>
    </main>
  );
}
