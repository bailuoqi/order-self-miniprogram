import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PageConfig } from "./page-config.entity";

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
  constructor(@InjectRepository(PageConfig) private repo: Repository<PageConfig>) {}

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
    let entity = await this.repo.findOne({ where: { page_key: pageKey } });
    if (!entity) {
      entity = this.repo.create({ page_key: pageKey, config_json: "{}", status: "published" });
    }
    entity.config_json = JSON.stringify(config);
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
}
