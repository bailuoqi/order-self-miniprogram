import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PageConfig } from "./page-config.entity";
import { PageConfigRevision } from "./page-config-revision.entity";

// 配置体积护栏：防止把图片 base64 等大数据误存进配置
const MAX_CONFIG_BYTES = 200 * 1024;
// 每个 page_key 保留的发布历史条数上限
const MAX_REVISIONS_PER_KEY = 20;

const DEFAULT_CONFIGS = {
  brand: {
    name: "定制接单",
    slogan: "软件定制 · 电子代做，先报价后开工",
  },
  home: {
    banner: { enabled: true, slides: [
      { image: "", title: "软件定制开发 · 先报价后开工", link: "" },
      { image: "", title: "电子产品代做 · 打样焊接一条龙", link: "" }
    ] },
    quickActions: [
      { icon: "ri-edit-box-line", name: "发布需求", link: "/subpkg/order/create-custom", color: "#1565C0", bg: "#E3F2FD" },
      { icon: "ri-file-list-3-line", name: "标准服务", link: "/subpkg/category/index", color: "#E65100", bg: "#FFF3E0" },
      { icon: "ri-team-line", name: "加入我们", link: "/subpkg/my/join-us", color: "#2E7D32", bg: "#E8F5E9" },
      { icon: "ri-customer-service-2-line", name: "联系客服", link: "/subpkg/my/about", color: "#6A1B9A", bg: "#F3E5F5" }
    ],
    notice: { enabled: true, text: "下单后团队报价，确认后付定金开工，交付满意再结尾款", link: "" },
    sections: [
      { type: "categories", title: "服务分类", enabled: true, showCount: 10 },
      { type: "products", title: "热门标准服务", enabled: true, tag: "hot", showCount: 4 },
      { type: "reviews", title: "客户评价", enabled: true, showCount: 3 }
    ]
  },
  category: {
    categories: []
  },
  my: {
    menuItems: [
      { icon: "ri-team-line", name: "加入我们", link: "/subpkg/my/join-us" },
      { icon: "ri-bill-line", name: "退款记录", link: "/subpkg/my/refund-list" },
      { icon: "ri-settings-3-line", name: "设置", link: "/subpkg/my/settings" },
      { icon: "ri-information-line", name: "关于我们", link: "/subpkg/my/about" }
    ]
  }
};

@Injectable()
export class PageConfigService {
  constructor(
    @InjectRepository(PageConfig) private repo: Repository<PageConfig>,
    @InjectRepository(PageConfigRevision) private revisionRepo: Repository<PageConfigRevision>,
  ) {}

  async getConfig(pageKey: string) {
    let config = await this.repo.findOne({ where: { page_key: pageKey } });
    if (!config) {
      // Init with defaults
      const defaults = DEFAULT_CONFIGS[pageKey] || {};
      config = this.repo.create({
        page_key: pageKey,
        config_json: JSON.stringify(defaults),
        status: "published",
      });
      await this.repo.save(config);
    }
    return JSON.parse(config.config_json);
  }

  async updateConfig(pageKey: string, config: any) {
    const configJson = JSON.stringify(config);
    this.assertConfigSize(configJson);
    let entity = await this.repo.findOne({ where: { page_key: pageKey } });
    if (!entity) {
      entity = this.repo.create({ page_key: pageKey, config_json: "{}", status: "published" });
    }
    entity.config_json = configJson;
    await this.repo.save(entity);
    return { success: true };
  }

  async publishConfig(pageKey: string) {
    await this.repo.update({ page_key: pageKey }, { status: "published" });
    return { success: true };
  }

  async getAllKeys() {
    const configs = await this.repo.find({ select: ["page_key", "status", "updated_at"] });
    return configs;
  }

  /**
   * 发布：带 config 则先写 `:key-draft` 再落 `:key`（保存+发布一次完成）；
   * 不带则把 `:key-draft` 现存内容复制到 `:key`。每次发布写一条 revision。
   */
  async publish(pageKey: string, config: any, operator?: string) {
    const draftKey = `${pageKey}-draft`;
    let configJson: string;

    if (config !== undefined && config !== null) {
      configJson = JSON.stringify(config);
      this.assertConfigSize(configJson);
      await this.upsertRow(draftKey, configJson, "draft");
    } else {
      const draft = await this.repo.findOne({ where: { page_key: draftKey } });
      if (!draft) {
        throw new NotFoundException(`草稿 ${draftKey} 不存在，无法发布`);
      }
      configJson = draft.config_json;
      if (draft.status !== "draft") {
        draft.status = "draft";
        await this.repo.save(draft);
      }
    }

    await this.upsertRow(pageKey, configJson, "published");
    const revision = await this.addRevision(pageKey, configJson, "publish", operator);
    return { success: true, page_key: pageKey, revision_id: revision.id, published_at: revision.created_at };
  }

  /** 发布历史列表（倒序、轻量摘要，不回整包 json） */
  async getRevisions(pageKey: string) {
    const rows = await this.revisionRepo.find({
      where: { page_key: pageKey },
      order: { id: "DESC" },
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      operator: r.operator,
      created_at: r.created_at,
      summary: this.buildSummary(r.config_json),
    }));
  }

  /** 单条历史的完整 config（回滚预检用） */
  async getRevision(pageKey: string, revisionId: number) {
    if (!Number.isInteger(revisionId) || revisionId <= 0) {
      throw new BadRequestException("revisionId 不合法");
    }
    const r = await this.revisionRepo.findOne({ where: { id: revisionId, page_key: pageKey } });
    if (!r) {
      throw new NotFoundException("指定版本不存在");
    }
    let config: any = null;
    try {
      config = JSON.parse(r.config_json);
    } catch {
      config = null;
    }
    return { id: r.id, page_key: r.page_key, action: r.action, operator: r.operator, created_at: r.created_at, config };
  }

  /** 回滚：把指定版本写回 `:key` 与 `:key-draft`，并记一条 rollback revision */
  async rollback(pageKey: string, revisionId: number, operator?: string) {
    if (!Number.isInteger(revisionId) || revisionId <= 0) {
      throw new BadRequestException("revisionId 必填且须为正整数");
    }
    const target = await this.revisionRepo.findOne({ where: { id: revisionId, page_key: pageKey } });
    if (!target) {
      throw new NotFoundException("指定版本不存在");
    }
    await this.upsertRow(`${pageKey}-draft`, target.config_json, "draft");
    await this.upsertRow(pageKey, target.config_json, "published");
    const revision = await this.addRevision(pageKey, target.config_json, "rollback", operator);
    return { success: true, page_key: pageKey, rolled_back_to: target.id, revision_id: revision.id };
  }

  /** 配置元信息（编辑器展示最后保存时间；也为三期乐观锁备好数据面） */
  async getMeta(pageKey: string) {
    const row = await this.repo.findOne({ where: { page_key: pageKey } });
    if (!row) {
      return { page_key: pageKey, status: null, updated_at: null };
    }
    return { page_key: row.page_key, status: row.status, updated_at: row.updated_at };
  }

  private assertConfigSize(configJson: string) {
    if (typeof configJson === "string" && Buffer.byteLength(configJson, "utf8") > MAX_CONFIG_BYTES) {
      throw new BadRequestException("配置体积超过 200KB 上限，请勿将图片 base64 等大数据存入配置");
    }
  }

  private async upsertRow(pageKey: string, configJson: string, status: string) {
    let entity = await this.repo.findOne({ where: { page_key: pageKey } });
    if (!entity) {
      entity = this.repo.create({ page_key: pageKey });
    }
    entity.config_json = configJson;
    entity.status = status;
    return this.repo.save(entity);
  }

  private async addRevision(pageKey: string, configJson: string, action: string, operator?: string) {
    const revision = await this.revisionRepo.save(
      this.revisionRepo.create({ page_key: pageKey, config_json: configJson, action, operator: operator || "" }),
    );
    // 每 key 仅保留最近 MAX_REVISIONS_PER_KEY 条（每 key 总量小，取全量 id 裁剪即可）
    const all = await this.revisionRepo.find({
      where: { page_key: pageKey },
      order: { id: "DESC" },
      select: ["id"],
    });
    const staleIds = all.slice(MAX_REVISIONS_PER_KEY).map((r) => r.id);
    if (staleIds.length) {
      await this.revisionRepo.delete(staleIds);
    }
    return revision;
  }

  private buildSummary(configJson: string) {
    const size_bytes = Buffer.byteLength(configJson || "", "utf8");
    try {
      const config = JSON.parse(configJson);
      const components = Array.isArray(config?.components) ? config.components : null;
      return {
        schema_version: typeof config?.schemaVersion === "number" ? config.schemaVersion : null,
        component_count: components ? components.length : null,
        component_types: components
          ? [...new Set(components.map((c: any) => c?.type).filter((t: any) => typeof t === "string"))]
          : [],
        size_bytes,
      };
    } catch {
      return { schema_version: null, component_count: null, component_types: [], size_bytes };
    }
  }
}
