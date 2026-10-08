import type { Tool } from "@/interface";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/app";
import Nav from "@/components/Nav/index";
import UrlParser from "@/tools/url-parser/UrlParser";
import type { UrlParserHandle } from "@/tools/url-parser/UrlParser";
import JsonViewer from "@/tools/json-viewer/JsonViewer";
import CronParser from "@/tools/cron-parser/CronParser";
import Base64Tool from "@/tools/base64-tool/Base64Tool";
// import RegexTester from "@/tools/regex-tester/RegexTester";
import { useT } from "@/i18n";
import clsx from "clsx";

export default function App() {
  const t = useT();
  const TOOLS: Tool[] = [
    { id: "url-parser", name: t("app.tool-url-parser"), component: UrlParser },
    { id: "json-viewer", name: t("app.tool-json-viewer"), component: JsonViewer },
    { id: "cron-parser", name: t("app.tool-cron-parser"), component: CronParser },
    { id: "base64-tool", name: t("app.tool-base64"), component: Base64Tool },
    // { id: "regex-tester", name: t("app.tool-regex"), component: RegexTester },
  ];

  const { activeId, themeId, pendingUrl, clearPendingUrl } = useAppStore();
  const urlParserRef = useRef<UrlParserHandle>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
  }, [themeId]);

  // 跨工具跳转：JSON 查看器点击 URL → 加载到解析器
  useEffect(() => {
    if (pendingUrl) {
      urlParserRef.current?.loadUrl(pendingUrl);
      clearPendingUrl();
    }
  }, [pendingUrl, clearPendingUrl]);

  // 各工具的特有 props
  const getToolProps = (toolId: string) => {
    if (toolId === "url-parser") return { ref: urlParserRef };
    return {};
  };

  return (
    <div className="app">
      {/* 导航栏 */}
      <Nav tools={TOOLS} menuTrigger="hover" />

      {/* 工具面板区 */}
      <main className="tool-stage">
        {TOOLS.map((tool) => {
          const Tool = tool.component;
          const props = getToolProps(tool.id);
          const hide = tool.id !== activeId;

          return (
            <div key={tool.id} className={clsx("tool-panel", { hide })}>
              <Tool {...props} />
            </div>
          );
        })}
      </main>

      {/* 页脚 */}
      <footer className="app-footer">{t("app.footer")}</footer>
    </div>
  );
}
