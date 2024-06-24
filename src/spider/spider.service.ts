import { Injectable } from '@nestjs/common';
import { CreateSpiderDto } from './dto/create-spider.dto';
import { UpdateSpiderDto } from './dto/update-spider.dto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaService } from 'src/prisma/prisma.service';
const cuid = require('cuid');
@Injectable()
export class SpiderService {
  constructor(private readonly prismaService: PrismaService) { }

  async create(createSpiderDto: CreateSpiderDto) {
  }

  async findSpiderListPage() {
    let pageNum = 1;
    let pageSize = 10;
    let spiderList = await this.prismaService.spiderWebsite.findMany({
      where: {
        keywords: ''
      },
      skip: (pageNum - 1) * pageSize,
      take: pageSize
    });
    return spiderList;
  }

  async findAll() {
    //经销商
    let url1 = "https://www.europages.cn/ep-api/v2/serp/companies?lang=zh-CN&search=%E7%BB%8F%E9%94%80%E5%95%86&page="
    //代理商
    let url2 = "https://www.europages.cn/ep-api/v2/serp/companies?lang=zh-CN&search=%E4%BB%A3%E7%90%86%E5%95%86&page=";
    //服务商
    let url3 = "https://www.europages.cn/ep-api/v2/serp/companies?lang=zh-CN&search=%E6%9C%8D%E5%8A%A1%E5%95%86&page=";
    //企业
    let url4 = "https://www.europages.cn/ep-api/v2/serp/companies?lang=zh-CN&search=%E4%BC%81%E4%B8%9A&page=";
    var flag = true;
    let pageNum = 1;
    while (flag) {
      let res = await axios.get(url4 + pageNum + '&mode=default');
      if (res.data != undefined && res.data.items != undefined && res.data.items.length != 0) {
        const itemMap = res.data.items.reduce((map, item) => {
          map.set(item.id, item);
          return map;
        }, new Map());
        const spider = await this.prismaService.spiderWebsite.findMany({
          where: { companyId: { in: Array.from(itemMap.keys()) } },
        });
        let spiderMap = new Map();
        if (spider != null && spider.length != 0) {
          spiderMap = spider.reduce((map, obj) => {
            map.set(obj.companyId, obj);
            return map;
          }, new Map());
        }
        let result = [];
        itemMap.forEach((value, key) => {
          if (!spiderMap.get(key)) {
            result.push(value);
          }
        });
        if (result.length != 0) {
          console.log("====================执行插入 页码 : " + pageNum + "========================")
          for (let j = 0; j < result.length; j++) {
            this.prismaService.spiderWebsite.create({
              data: {
                companyId: result[j].id,
                companyUrl: result[j].url,
                companyName: result[j].name,
                companyAddress: JSON.stringify(result[j].address)
              }
            }).catch(err => {
              console.log(err)
            })
          }
          console.log("====================插入 结束 页码 : " + pageNum + "========================")
        }
        pageNum += 1;
      } else {
        flag = false
      }
    }
  }
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  findOne(id: number) {
    return `findOne`;
  }

  update(id: number, updateSpiderDto: UpdateSpiderDto) {
    return `This action updates a #${id} spider`;
  }

  remove(id: number) {
    return `This action removes a #${id} spider`;
  }

  async garseURLData() {
    var flag = true;
    let pageNum = 1;
    let pageSize = 10;
    try {
      while (flag) {
        let spiderList = await this.prismaService.spiderWebsite.findMany({
          where: {
            keywords: ''
          },
          skip: (pageNum - 1) * pageSize,
          take: pageSize
        });
        if (spiderList != undefined && spiderList.length != 0) {
          for (let i = 0; i < spiderList.length; i++) {
            let spider = spiderList[i];
            if (spider.keywords === undefined || spider.keywords === '' || spider.keywords === null) {
              //console.log('https://www.europages.cn' + spider.companyUrl)
              try {
                const res = await axios.get('https://www.europages.cn' + spider.companyUrl);
                //const res = await axios.get('https://www.europages.cn/ATLANTIC-CHEMICALS-TRADING-GMBH/DEU269040-00101.html');
                let $ = cheerio.load(res.data)
                const linkElement = $('.ep-epages-home-links__websites a');
                // 提取 href 属性
                const href = linkElement.attr('href');
                const companyEstablished = $('li.ep-epages-business-details-year-established dd.ep-key-value__value');
                const companyEstablishedTime = companyEstablished.text().trim();
                const scaleNum = $('li.ep-epages-business-details-headcount dd.ep-key-value__value');
                const scaleNums = scaleNum.text().trim();
                const businessScope = $('li.ep-epages-business-details-main-activity dd.ep-key-value__value');
                const businessScopeStr = businessScope.text().trim();
                // 查找包含目标文本的元素
                const addressParts = [];
                $('dl.ep-epages-sidebar__info dd p').each((index, element) => {
                  const text = $(element).text().trim().replace(/^\s+|\s+$/g, '');
                  if (text) {
                    addressParts.push(text);
                  }
                });
                // 组装地址字符串
                const companyAddress = addressParts.join(' | ');
                const keywords = $('li.ep-keywords__list-item').map((index, element) => {
                  return $(element).text().trim();
                }).get();
                await this.prismaService.spiderWebsite.update(
                  {
                    where: { id: spider.id },
                    data: {
                      companyAddress: companyAddress,
                      businessScope: businessScopeStr,
                      scaleNum: scaleNums,
                      website: href,
                      companyEstablished: companyEstablishedTime,
                      keywords: keywords.join(', ')
                    }
                  }
                ).catch(err => {
                  console.log(err)
                })
                console.log('=============================结束:========= ' + spider.id)
              } catch {
                continue;
              }

            }
          }
        }
        pageNum = pageNum + 1;
        if (spiderList === undefined || spiderList.length === 0) {
          flag = false;
        }
      }
    } catch (err) {
      console.log("============================重新调用 解析网页==============================")
      this.garseURLData()
    }
    return "成功";
  }

  async updatePhone() {
    var flag = true;
    let pageNum = 1;
    let pageSize = 50;
    try {
      while (flag) {
        let spiderList = await this.prismaService.spiderWebsite.findMany({
          where: {
            contactPerson: ''
          },
          orderBy: {
            createdTime: 'desc'
          },
          skip: (pageNum - 1) * pageSize,
          take: pageSize
        });
        if (spiderList != undefined && spiderList.length != 0) {
          let myMap = new Map();
          for (let i = 0; i < spiderList.length; i++) {
            let spider = spiderList[i];
            if (spider.contactPerson === undefined || spider.contactPerson === '' || spider.contactPerson === null) {
              let phoneNumber = "";
              let landline = "";
              const phoneRes = await axios.get('https://www.europages.cn/ep-api/v2/epages/' + spider.companyId + '/phones')
              if (phoneRes.data != undefined && phoneRes.data.phones != undefined && phoneRes.data.phones.length != 0 && phoneRes.data.phones[0].items != undefined && phoneRes.data.phones[0].items.length != 0) {
                phoneRes.data.phones[0].items.forEach(phone => {
                  if (phone.type === 1) {
                    phoneNumber = phone.number
                  } else {
                    landline = phone.number
                  }
                })
                myMap.set(spider.id, JSON.stringify({
                  "phone": phoneNumber,
                  'landline': landline
                }))
              } else {
                myMap.set(spider.id, '000000')
              }
            }
          }
          this.updatePhoneById(myMap);
        }
        pageNum = pageNum + 1;
        if (spiderList === undefined || spiderList.length === 0) {
          flag = false;
        }
      }
    } catch (err) {
      console.log("=================重新调用===================")
      this.updatePhone();
    }
  }

  async updatePhoneById(map) {
    console.log("**************** updatePhoneById 更新开始 *******************" + map.size)
    for (const [k, v] of map) {
      await this.prismaService.spiderWebsite.update(
        {
          where: { id: k },
          data: {
            contactPerson: v
          }
        }
      ).catch(err => {
        console.log("============错误============", err)
      })
    }
    console.log("**************** updatePhoneById 更新 结束 *******************")
  }
}
