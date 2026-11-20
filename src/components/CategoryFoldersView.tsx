import React from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  CategoryFolder,
  FolderWordItem,
  Language,
  getItemsForFolder,
} from '../utils/aacBoardLogic';
import { THEME_STYLES } from './PictureGrid';

interface CategoryFoldersViewProps {
  folders: CategoryFolder[];
  folderItems: FolderWordItem[];
  activeFolderId: string | null;
  lang: Language;
  activeItemId: string | null;
  onSelectFolder: (folderId: string) => void;
  onSelectFolderWord: (item: FolderWordItem, folder: CategoryFolder) => void;
  onBack: () => void;
}

export const CategoryFoldersView: React.FC<CategoryFoldersViewProps> = ({
  folders,
  folderItems,
  activeFolderId,
  lang,
  activeItemId,
  onSelectFolder,
  onSelectFolderWord,
  onBack,
}) => {
  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null;
  const currentItems = activeFolder
    ? getItemsForFolder(folderItems, activeFolder.id)
    : [];

  return (
    <section
      aria-label={
        activeFolder
          ? `${lang === 'es' ? 'Carpeta' : 'Folder'}: ${
              lang === 'es' ? activeFolder.es : activeFolder.en
            }`
          : lang === 'es'
          ? 'Carpetas de categorías'
          : 'Category folders'
      }
      className="w-full rounded-3xl bg-white border-2 border-slate-200/90 shadow-xs p-3 sm:p-4"
    >
      {/* Fixed Grid where Top-Left Corner (Slot 1) is ALWAYS the Back Button */}
      <div
        data-testid="category-folders-grid"
        className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3.5 w-full"
      >
        {/* FIXED TOP-LEFT CORNER BACK BUTTON (Always in Slot 1) */}
        <button
          type="button"
          data-testid="folder-back-button"
          onClick={onBack}
          aria-label={lang === 'es' ? 'Volver atrás' : 'Back'}
          className="min-h-[112px] sm:min-h-[132px] lg:min-h-[144px] p-3 rounded-3xl border-2 border-b-[5px] border-slate-400 border-b-slate-600 bg-slate-100 hover:bg-slate-200 active:translate-y-1 flex flex-col items-center justify-center gap-2 text-slate-900 transition-transform cursor-pointer select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
            <ArrowLeft className="w-7 h-7" aria-hidden="true" />
          </div>
          <span className="text-lg sm:text-xl font-bold font-display whitespace-nowrap">
            {lang === 'es' ? 'Atrás' : 'Back'}
          </span>
        </button>

        {/* LEVEL 1: The 7 Category Folders (Talk, Food, Feelings, People, Places, Play, Colors) */}
        {!activeFolder &&
          folders.map((folder) => {
            const label = lang === 'es' ? folder.es : folder.en;
            const secondary = lang === 'es' ? folder.en : folder.es;
            const style = THEME_STYLES[folder.colorTheme] ?? THEME_STYLES.amber;

            return (
              <button
                key={folder.id}
                type="button"
                data-folder-id={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`min-h-[112px] sm:min-h-[132px] lg:min-h-[144px] p-3 rounded-3xl border-2 border-b-[5px] flex flex-col items-center justify-between transition-transform cursor-pointer select-none active:translate-y-1 ${style.cardBg} ${style.border}`}
              >
                <div
                  aria-hidden="true"
                  className="w-full flex items-center justify-end text-xs text-slate-600 font-medium"
                >
                  <span>{secondary}</span>
                </div>
                <div className="text-4xl sm:text-5xl leading-none my-1" aria-hidden="true">
                  {folder.icon}
                </div>
                <span className="text-lg sm:text-2xl font-bold text-slate-900 font-display whitespace-nowrap">
                  {label}
                </span>
              </button>
            );
          })}

        {/* LEVEL 2: Items Inside the Selected Category Folder */}
        {activeFolder &&
          currentItems.map((item) => {
            const label = lang === 'es' ? item.es : item.en;
            const secondary = lang === 'es' ? item.en : item.es;
            const style =
              THEME_STYLES[activeFolder.colorTheme] ?? THEME_STYLES.emerald;
            const isSpeakingThis = activeItemId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                data-folder-item-id={item.id}
                onClick={() => onSelectFolderWord(item, activeFolder)}
                className={`min-h-[112px] sm:min-h-[132px] lg:min-h-[144px] p-3 rounded-3xl border-2 border-b-[5px] flex flex-col items-center justify-between transition-transform cursor-pointer select-none ${
                  style.cardBg
                } ${style.border} ${
                  isSpeakingThis
                    ? `${style.activeRing} -translate-y-0.5`
                    : 'active:translate-y-1'
                }`}
              >
                <div
                  aria-hidden="true"
                  className="w-full flex items-center justify-end text-xs text-slate-600 font-medium"
                >
                  <span>{secondary}</span>
                </div>
                {item.swatch ? (
                  <div className="my-1 flex items-center justify-center" aria-hidden="true">
                    <svg
                      viewBox="0 0 64 64"
                      className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-xs"
                    >
                      <circle
                        cx="32"
                        cy="32"
                        r="27"
                        fill={item.swatch}
                        stroke="#334155"
                        strokeWidth="3"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="23"
                        fill="none"
                        stroke="rgba(255,255,255,0.45)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="text-4xl sm:text-5xl leading-none my-1" aria-hidden="true">
                    {item.icon}
                  </div>
                )}
                <span className="text-sm sm:text-lg lg:text-xl font-bold text-slate-900 font-display text-center leading-tight line-clamp-2 max-w-full">
                  {label}
                </span>
              </button>
            );
          })}
      </div>
    </section>
  );
};
