import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findKeywordFolder, getProjectRoot } from '@/lib/paths';

export async function POST(request) {
  try {
    const body = await request.json();
    const { category, collection, segment } = body || {};

    if (!category || !collection) {
      return NextResponse.json(
        { success: false, error: 'Category and collection are required' },
        { status: 400 }
      );
    }

    const root = getProjectRoot();
    const kwPath = findKeywordFolder(category, collection);

    if (!kwPath || !fs.existsSync(kwPath)) {
      return NextResponse.json(
        { success: false, error: 'Ниша еще не развернута в Keywords. Сначала инициализируйте нишу.' },
        { status: 400 }
      );
    }

    let targetDir = kwPath;
    if (segment && typeof segment === 'string') {
      const segPath = path.join(kwPath, segment.trim());
      if (fs.existsSync(segPath)) {
        targetDir = segPath;
      }
    }

    // Source template: prefer master script in scripts/ or manager_gui/templates/
    let srcTemplate = path.join(root, 'Keywords', 'Artify Studio', 'scripts', 'ai_auto_content_filler_UI.py');
    if (!fs.existsSync(srcTemplate)) {
      srcTemplate = path.join(root, 'manager_gui', 'templates', 'ai_auto_content_filler_UI.py');
    }
    if (!fs.existsSync(srcTemplate)) {
      srcTemplate = path.join(root, 'Keywords', 'Scripts for Faster', 'ai_auto_content_filler_UI.py');
    }

    if (!fs.existsSync(srcTemplate)) {
      return NextResponse.json(
        { success: false, error: 'Шаблон ai_auto_content_filler_UI.py не найден в templates/' },
        { status: 404 }
      );
    }

    const destFile = path.join(targetDir, 'ai_auto_content_filler_UI.py');
    fs.copyFileSync(srcTemplate, destFile);

    return NextResponse.json({
      success: true,
      message: 'Скрипт ai_auto_content_filler_UI.py успешно скопирован в нишу!',
      destination: path.relative(root, destFile)
    });
  } catch (error) {
    console.error('Error copying Streamlit template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ошибка копирования шаблона' },
      { status: 500 }
    );
  }
}
