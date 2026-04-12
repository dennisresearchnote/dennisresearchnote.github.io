# frozen_string_literal: true

require "fileutils"
require "yaml"
require "date"

ROOT = File.expand_path("..", __dir__)
POSTS_DIR = File.join(ROOT, "_posts")
CATEGORY_ROOT = ROOT
PER_PAGE = 5

def extract_front_matter(path)
  content = File.read(path, encoding: "utf-8")
  return {} unless content.start_with?("---")

  parts = content.split(/^---\s*$\n?/, 3)
  return {} if parts.length < 3

  YAML.safe_load(parts[1], permitted_classes: [Date, Time], aliases: true) || {}
rescue StandardError => e
  warn "Failed to parse front matter: #{path} (#{e.message})"
  {}
end

def normalize_categories(raw_categories)
  case raw_categories
  when Array
    raw_categories.map(&:to_s).map(&:strip).reject(&:empty?)
  when String
    raw_categories.split(",").map(&:strip).reject(&:empty?)
  else
    []
  end
end

def write_page(path, content)
  FileUtils.mkdir_p(File.dirname(path))
  File.write(path, content, mode: "w", encoding: "utf-8")
end

# blog/index.html은 건드리지 않음
# 자동 생성 대상은 blog/<top>/index.html, blog/<top>/<sub>/index.html
# + 페이지네이션용 blog/<top>/page/N/index.html, blog/<top>/<sub>/page/N/index.html
# 기존 자동 생성 결과만 정리
Dir.glob(File.join(CATEGORY_ROOT, "*", "index.html")).each do |path|
  File.delete(path) if File.file?(path)
end

Dir.glob(File.join(CATEGORY_ROOT, "*", "*", "index.html")).each do |path|
  File.delete(path) if File.file?(path)
end

Dir.glob(File.join(CATEGORY_ROOT, "*", "page")).each do |path|
  FileUtils.rm_rf(path) if File.directory?(path)
end

Dir.glob(File.join(CATEGORY_ROOT, "*", "*", "page")).each do |path|
  FileUtils.rm_rf(path) if File.directory?(path)
end

Dir.glob(File.join(CATEGORY_ROOT, "*")).each do |path|
  next unless File.directory?(path)
  next if File.basename(path).start_with?(".")
  next if File.basename(path) == "assets"

  # 비어 있는 하위 디렉터리 정리
  Dir.glob(File.join(path, "*")).each do |subpath|
    FileUtils.rm_rf(subpath) if File.directory?(subpath) && Dir.empty?(subpath)
  end

  FileUtils.rm_rf(path) if Dir.empty?(path)
end

posts = Dir.glob(File.join(POSTS_DIR, "*.{md,markdown,html}"))

category_tree = {}
post_counts = Hash.new(0)

posts.each do |post_path|
  data = extract_front_matter(post_path)
  categories = normalize_categories(data["categories"])
  next if categories.empty?

  top = categories[0]
  sub = categories[1]

  category_tree[top] ||= []
  category_tree[top] << sub if sub && !sub.empty? && !category_tree[top].include?(sub)

  post_counts[[top, nil]] += 1
  post_counts[[top, sub]] += 1 if sub && !sub.empty?
end

category_tree.keys.sort.each do |top|
  top_total_posts = post_counts[[top, nil]]
  top_total_pages = (top_total_posts.to_f / PER_PAGE).ceil
  top_total_pages = 1 if top_total_pages < 1

  (1..top_total_pages).each do |page_num|
    permalink =
      if page_num == 1
        "/#{top}/"
      else
        "/#{top}/page/#{page_num}/"
      end

    top_page = <<~HTML
      ---
      layout: post-list
      title: #{top}
      category_name: #{top}
      permalink: #{permalink}
      page_num: #{page_num}
      total_pages: #{top_total_pages}
      per_page: #{PER_PAGE}
      paginate_base: /#{top}/
      ---
    HTML

    output_path =
      if page_num == 1
        File.join(CATEGORY_ROOT, top, "index.html")
      else
        File.join(CATEGORY_ROOT, top, "page", page_num.to_s, "index.html")
      end

    write_page(output_path, top_page)
  end

  category_tree[top].compact.sort.each do |sub|
    sub_total_posts = post_counts[[top, sub]]
    sub_total_pages = (sub_total_posts.to_f / PER_PAGE).ceil
    sub_total_pages = 1 if sub_total_pages < 1

    (1..sub_total_pages).each do |page_num|
      permalink =
        if page_num == 1
          "/#{top}/#{sub}/"
        else
          "/#{top}/#{sub}/page/#{page_num}/"
        end

      sub_page = <<~HTML
        ---
        layout: post-list
        title: #{sub}
        category_name: #{top}
        subcategory_name: #{sub}
        permalink: #{permalink}
        page_num: #{page_num}
        total_pages: #{sub_total_pages}
        per_page: #{PER_PAGE}
        paginate_base: /#{top}/#{sub}/
        ---
      HTML

      output_path =
        if page_num == 1
          File.join(CATEGORY_ROOT, top, sub, "index.html")
        else
          File.join(CATEGORY_ROOT, top, sub, "page", page_num.to_s, "index.html")
        end

      write_page(output_path, sub_page)
    end
  end
end

puts "Generated category pages:"
category_tree.keys.sort.each do |top|
  puts "  /#{top}/"

  top_total_posts = post_counts[[top, nil]]
  top_total_pages = (top_total_posts.to_f / PER_PAGE).ceil
  top_total_pages = 1 if top_total_pages < 1

  if top_total_pages > 1
    (2..top_total_pages).each do |page_num|
      puts "  /#{top}/page/#{page_num}/"
    end
  end

  category_tree[top].compact.sort.each do |sub|
    puts "  /#{top}/#{sub}/"

    sub_total_posts = post_counts[[top, sub]]
    sub_total_pages = (sub_total_posts.to_f / PER_PAGE).ceil
    sub_total_pages = 1 if sub_total_pages < 1

    if sub_total_pages > 1
      (2..sub_total_pages).each do |page_num|
        puts "  /#{top}/#{sub}/page/#{page_num}/"
      end
    end
  end
end